<script>
  export let logs;
</script>
<style>
  .logs {
    position: absolute;
    bottom: 0;
    width: 100%;
  }
</style>

<div class="logs">
  {#each logs as log}
    <div class={`console-${log.level}`}>{log.args}</div>
  {/each}
</div>