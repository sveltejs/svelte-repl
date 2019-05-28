const workers = new Map();

let uid = 1;

export default class Bundler {
	constructor({ workersUrl, svelteUrl, onstatus }) {
		if (!workers.has(svelteUrl)) {
			const worker = new Worker(`${workersUrl}/bundler.js`);
			worker.postMessage({ type: 'init', svelteUrl });
			workers.set(svelteUrl, worker);
		}

		this.worker = workers.get(svelteUrl);

		this.handlers = new Map();

		this.worker.addEventListener('message', event => {
			if (event.data.type === 'status') {
				onstatus(event.data.message);
				return;
			}

			const handler = this.handlers.get(event.data.uid);

			if (handler) { // if no handler, was meant for a different REPL
				onstatus(null);
				handler(event.data);
				this.handlers.delete(event.data.uid);
			}
		});
	}

	bundle(components) {
		return new Promise(fulfil => {
			this.handlers.set(uid, fulfil);

			this.worker.postMessage({
				uid,
				type: 'bundle',
				components
			});

			uid += 1;
		});
	}

	destroy() {
		this.worker.terminate();
	}
}