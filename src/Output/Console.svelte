<script>
	import JSONNode from 'svelte-json-tree';

	export let logs;
</script>

<div class="container">
	{#each logs as log}
		<div class="log console-{log.level}">
			{#each log.args as arg}
				<JSONNode value={arg} />
			{/each}
		</div>
	{/each}
</div>

<style>
	.log {
		border-bottom: 1px solid #eee;
		padding: 5px 10px;
		display: flex;
	}

	.log > :global(*) {
		margin-right: 10px;
		font-family: var(--font-mono);
	}

	.console-warn {
		background: #fffbe6;
		border-color: #fff4c4;
	}

	.console-error {
		background: #fff0f0;
		border-color: #fed6d7;
	}
</style>