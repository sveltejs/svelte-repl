import { create_worker } from '../utils.js';

const workers = new Map();

let uid = 1;

function worker_fn() {
	self.window = self; // egregious hack to get magic-string to work in a worker

	let fulfil_ready;
	const ready = new Promise(f => {
		fulfil_ready = f;
	});

	self.addEventListener('message', async event => {
		switch (event.data.type) {
			case 'init':
				importScripts(`${event.data.svelteUrl}/compiler.js`);
				fulfil_ready();
				break;

			case 'compile':
				await ready;
				postMessage(compile(event.data));
				break;
		}
	});

	const common_options = {
		dev: false,
		css: false
	};

	function compile({ id, source, options }) {
		try {
			const { js, css } = svelte.compile(
				source,
				Object.assign({}, common_options, options)
			);

			return {
				id,
				result: {
					js: js.code,
					css: css.code || `/* Add a <sty` + `le> tag to see compiled CSS */`
				}
			};
		} catch (err) {
			let message = `/* Error compiling component\n\n${err.message}`;
			if (err.frame) message += `\n${err.frame}`;
			message += `\n\n*/`;

			return {
				id,
				result: {
					js: message,
					css: message
				}
			};
		}
	}
}

export default class Compiler {
	constructor(svelteUrl) {
		if (!workers.has(svelteUrl)) {
			const worker = create_worker(worker_fn);
			worker.postMessage({ type: 'init', svelteUrl });
			workers.set(svelteUrl, worker);
		}

		this.worker = workers.get(svelteUrl);

		this.handlers = new Map();

		this.worker.addEventListener('message', event => {
			const handler = this.handlers.get(event.data.id);

			if (handler) { // if no handler, was meant for a different REPL
				handler(event.data.result);
				this.handlers.delete(event.data.id);
			}
		});
	}

	compile(component, options) {
		return new Promise(fulfil => {
			const id = uid++;

			this.handlers.set(id, fulfil);

			this.worker.postMessage({
				id,
				type: 'compile',
				source: component.source,
				options: Object.assign({
					name: component.name,
					filename: `${component.name}.svelte`
				}, options),
				entry: component.name === 'App'
			});
		});
	}

	destroy() {
		this.worker.terminate();
	}
}