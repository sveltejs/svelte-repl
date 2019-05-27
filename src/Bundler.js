const workers = new Map();

let uid = 1;

export default class Bundler {
	constructor(workersUrl, svelteUrl, rollupUrl) {
		if (!workers.has(svelteUrl)) {
			const worker = new Worker(`${workersUrl}/bundler.js`);
			worker.postMessage({ type: 'init', svelteUrl, rollupUrl });
			workers.set(svelteUrl, worker);
		}

		this.worker = workers.get(svelteUrl);

		this.handlers = new Map();

		this.worker.addEventListener('message', event => {
			const handler = this.handlers.get(event.data.id);

			if (handler) { // if no handler, was meant for a different REPL
				handler(event.data);
				this.handlers.delete(event.data.id);
			}
		});
	}

	bundle(components) {
		return new Promise(fulfil => {
			const id = uid++;

			this.handlers.set(id, fulfil);

			this.worker.postMessage({
				id,
				type: 'bundle',
				components
			});
		});
	}

	destroy() {
		this.worker.terminate();
	}
}