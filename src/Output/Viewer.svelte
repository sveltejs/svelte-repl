<script>
	import { onMount, createEventDispatcher, getContext } from 'svelte';
	import getLocationFromStack from './getLocationFromStack.js';
	import ReplProxy from './ReplProxy.js';
	import Message from '../Message.svelte';
	import srcdoc from './srcdoc/index.js';
	import { decode } from 'sourcemap-codec';

	const dispatch = createEventDispatcher();
	const { bundle, navigate } = getContext('REPL');

	export let error; // TODO should this be exposed as a prop?

	export function setProp(prop, value) {
		if (!proxy) return;
		proxy.setProp(prop, value);
	}

	export let status;
	export let relaxed = false;
	export let injectedJS = '';
	export let injectedCSS = '';

	let iframe;
	let pending_imports = 0;
	let pending = false;

	let proxy = null;

	let ready = false;
	let inited = false;

	onMount(() => {
		proxy = new ReplProxy(iframe, {
			on_fetch_progress: progress => {
				pending_imports = progress;
			}
		});

		iframe.addEventListener('load', () => {
			proxy.handle_links();
			ready = true;
		});

		window.addEventListener('message', (event) => {
			if (event.data && (event.data.type === 'error' || event.data.type === 'unhandledrejection')) {
				const data = event.data.value;
				if (event.data.type === 'unhandledrejection') {
					data.message = 'Uncaught (in promise): ' + data.message;
				}
				const loc = getLocationFromStack(data.stack, $bundle.dom.map);
				if (loc) {
					data.filename = loc.source;
					data.loc = { line: loc.line, column: loc.column };
				}

				error = data;
			}
		}, false);

		return () => {
			proxy.destroy();
		}
	});

	async function apply_bundle($bundle) {
		if (!$bundle || $bundle.error) return;

		try {
			await proxy.eval(`
				${injectedJS}

				${styles}

				const styles = document.querySelectorAll('style[id^=svelte-]');

				${$bundle.dom.code}

				let i = styles.length;
				while (i--) styles[i].parentNode.removeChild(styles[i]);

				if (window.component) {
					try {
						window.component.$destroy();
					} catch (err) {
						console.error(err);
					}
				}

				document.body.innerHTML = '';
				window.location.hash = '';
				window._svelteTransitionManager = null;

				window.component = new SvelteComponent.default({
					target: document.body
				});

				window.onerror = function (msg, url, lineNo, columnNo, error) {
					window.parent.postMessage({ type: 'error', value: error }, '*');
				}

				window.addEventListener("unhandledrejection", event => {
					window.parent.postMessage({ type: 'unhandledrejection', value: event.reason }, '*');
				});
			`);

			error = null;
		} catch (e) {
			const loc = getLocationFromStack(e.stack, $bundle.dom.map);
			if (loc) {
				e.filename = loc.source;
				e.loc = { line: loc.line, column: loc.column };
			}

			error = e;
		}

		inited = true;
	}

	$: if (ready) apply_bundle($bundle);

	$: styles = injectedCSS && `{
		const style = document.createElement('style');
		style.textContent = ${JSON.stringify(injectedCSS)};
		document.head.appendChild(style);
	}`;
</script>

<style>
	.iframe-container {
		position: absolute;
		background-color: white;
		border: none;
		width: 100%;
		height: 100%;
	}

	iframe {
		width: 100%;
		height: 100%;
		/* height: calc(100vh - var(--nav-h)); */
		border: none;
		display: block;
	}

	.greyed-out {
		filter: grayscale(50%) blur(1px);
		opacity: .25;
	}

	.overlay {
		position: absolute;
		bottom: 0;
		width: 100%;
	}
</style>

<div class="iframe-container">
	<iframe
		title="Result"
		class:inited
		bind:this={iframe}
		sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-modals {relaxed ? 'allow-same-origin' : ''}"
		class="{error || pending || pending_imports ? 'greyed-out' : ''}"
		{srcdoc}
	></iframe>

	<div class="overlay">
		{#if error}
			<Message kind="error" details={error}/>
		{:else if status || !$bundle}
			<Message kind="info" truncate>{status || 'loading Svelte compiler...'}</Message>
		{/if}
	</div>
</div>