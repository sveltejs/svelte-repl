import * as rollup from 'rollup/dist/rollup.browser.es.js';
import commonjs from './plugins/commonjs.js';
import glsl from './plugins/glsl.js';
import json from './plugins/json.js';

self.window = self; // egregious hack to get magic-string to work in a worker

let svelteUrl;

self.addEventListener('message', async event => {
	switch (event.data.type) {
		case 'init':
			svelteUrl = event.data.svelteUrl;
			importScripts(`${svelteUrl}/compiler.js`);

			break;

		case 'bundle':
			if (event.data.components.length === 0) return;

			const result = await bundle(event.data);
			if (result) {
				postMessage(result);
			}

			break;
	}
});

const common_options = {
	dev: true,
};

let cached = {
	dom: {},
	ssr: {}
};

const fetch_cache = new Map();
function fetch_if_uncached(url) {
	if (fetch_cache.has(url)) {
		return fetch_cache.get(url);
	}

	const promise = fetch(url)
		.then(async r => {
			if (r.ok) {
				return {
					url: r.url,
					body: await r.text()
				};
			}

			throw new Error(await r.text());
		})
		.catch(err => {
			fetch_cache.delete(url);
			throw err;
		});

	fetch_cache.set(url, promise);
	return promise;
}

async function follow_redirects(url) {
	const res = await fetch_if_uncached(url);
	return res.url;
}

async function get_bundle(mode, cache, lookup) {
	let bundle;
	const all_warnings = [];

	const new_cache = {};

	const repl_plugin = {
		async resolveId(importee, importer) {
			// importing from Svelte
			if (importee === `svelte`) return `${svelteUrl}/index.mjs`;
			if (importee.startsWith(`svelte/`)) return `${svelteUrl}/${importee.slice(7)}.mjs`;

			// temporary workaround for lack of package.json files in sub-packages
			// https://github.com/sveltejs/svelte/pull/2887
			if (importer && importer.startsWith(svelteUrl)) {
				const resolved = new URL(importee, importer).href;
				return resolved.endsWith('.mjs') ? resolved : `${resolved}.mjs`;
			}

			// importing from another file in REPL
			if (importee in lookup) return importee;

			// importing from a URL
			if (importee.startsWith('http:') || importee.startsWith('https:')) return importee;

			// importing from (probably) unpkg
			if (importee.startsWith('.')) {
				return await follow_redirects(new URL(importee, importer).href);
			}

			else {
				// fetch from unpkg
				try {
					const pkg_url = await follow_redirects(`https://unpkg.com/${importee}/package.json`);
					const pkg_json = (await fetch_if_uncached(pkg_url)).body;
					const pkg = JSON.parse(pkg_json);

					if (pkg.svelte || pkg.module || pkg.main) {
						const url = pkg_url.replace(/\/package\.json$/, '');
						return new URL(pkg.svelte || pkg.module || pkg.main, `${url}/`).href;
					}
				} catch (err) {
					// ignore
				}

				return await follow_redirects(`https://unpkg.com/${importee}`);
			}
		},
		async load(id) {
			if (id in lookup) return lookup[id].source;

			if (!fetch_cache.has(id)) {
				self.postMessage({
					type: 'fetch',
					url: id
				});
			}

			const res = await fetch_if_uncached(id);
			return res.body;
		},
		transform(code, id) {
			if (!/\.svelte$/.test(id)) return null;

			const name = id.split('/').pop().split('.')[0];

			const result = cache[id] && cache[id].code === code
				? cache[id].result
				: svelte.compile(code, Object.assign({
					generate: mode,
					format: 'esm',
					name,
					filename: name + '.svelte'
				}, common_options));

			new_cache[id] = { code, result };

			(result.warnings || result.stats.warnings).forEach(warning => { // TODO remove stats post-launch
				all_warnings.push({
					message: warning.message,
					filename: warning.filename,
					start: warning.start,
					end: warning.end
				});
			});

			return result.js;
		}
	};

	try {
		bundle = await rollup.rollup({
			input: './App.svelte',
			plugins: [
				repl_plugin,
				commonjs,
				json,
				glsl
			],
			inlineDynamicImports: true,
			onwarn(warning) {
				all_warnings.push({
					message: warning.message
				});
			}
		});
	} catch (error) {
		return { error, bundle: null, cache: new_cache, warnings: all_warnings };
	}

	return { bundle, cache: new_cache, error: null, warnings: all_warnings };
}

async function bundle({ id, components }) {
	console.clear();
	console.log(`running Svelte compiler version %c${svelte.VERSION}`, 'font-weight: bold');

	const lookup = {};
	components.forEach(component => {
		const path = `./${component.name}.${component.type}`;
		lookup[path] = component;
	});

	const import_map = new Map();
	let dom;
	let error;

	try {
		dom = await get_bundle('dom', cached.dom, lookup);
		if (dom.error) {
			throw dom.error;
		}

		cached.dom = dom.cache;

		let uid = 1;

		const dom_result = (await dom.bundle.generate({
			format: 'iife',
			name: 'SvelteComponent',
			globals: id => {
				const name = `import_${uid++}`;
				import_map.set(id, name);
				return name;
			},
			exports: 'named',
			sourcemap: true
		})).output[0];

		const ssr = false // TODO how can we do SSR?
			? await get_bundle('ssr', cached.ssr, lookup)
			: null;

		if (ssr) {
			cached.ssr = ssr.cache;
			if (ssr.error) {
				throw ssr.error;
			}
		}

		const ssr_result = ssr
			? (await ssr.bundle.generate({
				format: 'iife',
				name: 'SvelteComponent',
				globals: id => import_map.get(id),
				exports: 'named',
				sourcemap: true
			})).output[0]
			: null;

		return {
			id,
			imports: dom_result.imports,
			import_map,
			dom: dom_result,
			ssr: ssr_result,
			warnings: dom.warnings,
			error: null
		};
	} catch (err) {
		const e = error || err;
		delete e.toString;

		return {
			id,
			imports: [],
			import_map,
			dom: null,
			ssr: null,
			warnings: dom.warnings,
			error: Object.assign({}, e, {
				message: e.message,
				stack: e.stack
			})
		};
	}
}