<script>
	import JSONNode from 'svelte-json-tree';

	export let log;
	export let level = 1;

	function toggleGroupCollapse() {
		log.collapsed = !log.collapsed;
	}
</script>


<div class="log console-{log.level}" style="padding-left: {level * 15}px" on:click={toggleGroupCollapse}>
	{#if log.count > 1}
		<span class="count">{log.count}x</span>
	{/if}

	{#if log.level === 'clear'}
		<span class="info">Console was cleared</span>
	{:else if log.level === 'unclonable'}
		<span class="info error">Message could not be cloned. Open devtools to see it</span>
	{:else if log.level === 'group'}
		<div class="arrow" class:expand={!log.collapsed}>▶</div>
		<span class="title">{log.label}</span>
	{:else}
		{#each log.args as arg}
			<JSONNode value={arg} />
		{/each}
	{/if}
	{#each new Array(level - 1) as _, idx}
		<div class="outline" style="left: {idx * 15 + 15}px" />
	{/each}
</div>

{#if log.level === 'group' && !log.collapsed}
	{#each log.logs as childLog}
		<svelte:self log={childLog} level={level + 1}/>
	{/each}
{/if}

<style>
	.log {
		border-bottom: 1px solid #eee;
		padding: 5px 10px 0px;
		display: flex;
		position: relative;
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

	.console-group {
		cursor: pointer;
		user-select: none;
	}

	.count {
		color: #999;
		font-size: 12px;
		line-height: 1.2;
	}

	.info {
		color: #666;
		font-family: var(--font) !important;
		font-size: 12px;
	}

	.error {
		color: #da106e; /* todo make this a var */
	}

	.outline {
		border-left: 1px solid #9c9cab;
		position: absolute;
		top: 0;
		bottom: -1px;
	}

	.arrow {
		position: absolute;
		font-size: 0.6em;
		transition: 150ms;
		transform-origin: 50% 50%;
		transform: translateX(-50%);
	}

	.arrow.expand {
		transform: translateX(-50%) rotateZ(90deg);
	}

	.title {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: bold;
		padding-left: 11px;
		height: 19px;
	}
</style>