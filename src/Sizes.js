let id = 1;

export const defaultSizes = {sources: [0], compiled: 0, minified: 0, gzipped: 0};

export default class Sizes {

	constructor(workersUrl, packagesUrl) {
		this.worker = new Worker(`${workersUrl}/sizes.js`)
		this.worker.postMessage({ type: 'init', packagesUrl });
		
		this.handlers = new Map();

		this.worker.addEventListener('message', event => {
			const handler = this.handlers.get(event.data.id);

			if (handler) { // if no handler, was meant for a different REPL
				handler(event.data.sizes);
				this.handlers.delete(event.data.id);
			}
		});
	}

	getSizes(compiled, components = []) {
		return new Promise(fulfil => {
			const uid = id++;
			this.handlers.set(uid, fulfil);
			this.worker.postMessage({ id: uid, compiled, components });
		});
	}

	destroy() {
		this.worker.terminate();
	}
}