<script>
  export let beautify = false;
  export let beautifyCss;
  $: {
    beautifyCss(beautify)
  }
</script>

<style>
	.options {
		padding: 0 10px;
		font-family: var(--font-mono);
		font-size: 13px;
		color: #999;
		line-height: 1.8;
	}

	.option {
		display: block;
		padding: 0 0 0 1.25em;
		white-space: nowrap;
		color: #333;
		user-select: none;
	}

	.key {
		display: inline-block;
		width: 9em;
	}

	.boolean {
		color: hsl(45, 7%, 45%);
	}

	label {
		display: inline-block;
	}

	input[type=checkbox] {
		top: -1px;
	}

</style>

<div class="options">
	*Note this is not a compiler option
	<label class="option">
		<span class="key">beautify:</span>
		<input type="checkbox" bind:checked={beautify}> <span class="boolean">{beautify}</span>
	</label>
</div>