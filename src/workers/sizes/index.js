let fulfil_ready;

const ready = new Promise(f => {
	fulfil_ready = f;
});

function getBytesLength(source) {
	// TODO: Maybe we could use new Blob() instead ?
	return new TextEncoder().encode(source).length;
}

let packagesUrl;

self.addEventListener('message', async event => {
	const { id, type = 'sizes', compiled, components } = event.data;
	switch (type) {
		case 'init':
			packagesUrl = event.data.packagesUrl;
			importScripts(`${packagesUrl}/terser@4.6.3/dist/bundle.min.js`)
			importScripts(`${packagesUrl}/pako@1.0.11/dist/pako_deflate.min.js`)
			fulfil_ready();
			break;
	
		case 'sizes':
			await ready;
			postMessage({
				id,
				sizes: getSizes(compiled, components, { gzipLevel: 6 })
			});
			break;
	}
});


function getSizes(compiledCode, components, options) {
	let minified = 0;
	let gzipped = 0;

	const sources = components.map(({ source }) => getBytesLength(source));
	const compiled = getBytesLength(compiledCode);

	const terser = Terser.minify(compiledCode);
	if (!terser.error) {
		minified = getBytesLength(terser.code);
		gzipped = getBytesLength(pako.gzip(terser.code, {level: options.gzipLevel, to: 'string'}));
	}
	
	return {
			sources,
			compiled,
			minified,
			gzipped
		}
}