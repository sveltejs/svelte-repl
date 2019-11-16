<script>
  import JSONNode from 'svelte-json-tree';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let logs;

  $: logs_length = logs.filter(log => log.level !== 'announcement').length

  function toggleExpand() {
    dispatch('toggle');
  }
  function clear(event) {
    event.stopPropagation();
    dispatch('clear');
  }
</script>
<style>
  .logs {
    height: calc(100% - 42px);
    overflow: auto;
  }
  .container {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
  .header {
    height: 42px;
    color: #333;
    background: var(--back);
    border-top: 1px solid var(--second);
    border-bottom: 1px solid var(--second);
    font: 400 12px/1.5 var(--font);
    padding: 12px 12px 8px 12px;
    cursor: pointer;
  }
  .pill {
    background: var(--prime);
    color: white;
    border-radius: 50%;
    padding: 2px 4px;
    font-size: 0.8em;
    min-width: 18px;
    display: inline-block;
    text-align: center;
  }
  .log {
    border-bottom: 1px solid #eee;
    padding: 5px 10px;
    display: flex;
  }
  .log > :global(*) {
    margin-right: 10px;
  }
  .console-warn {
    background: #fffbe6;
    border-color: #fff4c4;
  }
  .console-error {
    background: #fff0f0;
    border-color: #fed6d7;
  }
  .console-announcement {
    background: #fffbe6;
    border-color: #fff4c4;
    color: #735828;
    font-size: 13px;
  }
  button {
    float: right;
    color: #999;
  }
  button:hover {
    color: #333;
  }
</style>
<div class="container">
  <div class="header" on:click={toggleExpand}>
    Console 
    {#if logs_length > 0}
      <span class="pill">{logs_length}</span>
    {/if}
    <button on:click={clear}>Clear</button>
  </div>
  <div class="logs">
    {#each logs as log}
      <div class={`log console-${log.level}`}>
        {#if log.level === 'announcement'}
          {log.message}
        {:else}
          {#each log.args as arg}
            <JSONNode value={arg} />
          {/each}
        {/if}
      </div>
    {/each}
  </div>
</div>