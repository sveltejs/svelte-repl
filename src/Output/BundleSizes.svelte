<script>
	export let sources;
	export let compiled;
	export let minified;
	export let gzipped;

	$: sourcesSize = normalize(
		sources.reduce((total, bytes) => total + bytes, 0)
	);
	$: compiledSize = normalize(compiled);
	$: minifiedSize = normalize(minified);
	$: gzippedSize = normalize(gzipped);

	function normalize(value) {
		if (value === 0) {
			return "n/a";
		}
		// we are using KiB here displayed the Microsoft Way KB
		return value > 1024 ? `${(value / 1024).toFixed(2)} KB` : `${value} B`;
	}
</script>

<style>
	.sizes {
		display: flex;
		flex-direction: column;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.8;
		height: 100%;
		padding: 1rem;
		justify-content: space-between;
	}

	span {
		margin-left: 0.5rem;
		color: #999;
	}

	.info {
    	font-family: var(--font);
    	margin-top: 1rem;
    	background-color: var(--back-light);
    	color: #999;
    	padding: 1rem;
    	border-radius: 4px;
  	}

	.info mark {
    	background-color: inherit;
	}
</style>

<div class="sizes">
	<div>
    	<div>
      		Sources:
      		<span>{sourcesSize}</span>
    	</div>
    	<div>
			Compiled:
      		<span>{compiledSize}</span>
    	</div>
    	<div>
			Minified:
			<span>{minifiedSize}</span>
		</div>
		<div>
      		Gzipped:
      		<span>{gzippedSize}</span>
    	</div>
	</div>

	<div class="info">
    	<mark>Sources</mark>
    	correspond to the combined size of all source files. It does not take into
    	account external imports.
    	<br />
    	<mark>Compiled</mark>
    	correspond to the generated bundle size (external imports included).
    	<br />
    	<mark>Minified</mark>
    	code is generated using
    	<a href="https://terser.org" target="_blank">Terser</a>
    	on the Compiled code.
    	<br />
    	<mark>Gzipped</mark>
    	code is generated using
    	<a href="http://nodeca.github.io/pako/" target="_blank">Pako</a>
    	on the Minified code with a default level compression of 6.
  	</div>
</div>
