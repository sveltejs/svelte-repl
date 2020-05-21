<script>
  import Repl from './components/Repl/Repl.svelte';
  import { onMount } from 'svelte';
  let repl;

  const code_1 = `<script>
	let count = 0;
	console.log('This is working!!!')
<\/script>

<style>
	button{
		color: white;
		background-color: black;
		border: 3px solid gray;
		font-size: 1.2em;
		margin: 1em;
	}
</style>

<button on:click={()=>count--}>-</button>
{count}
<button on:click={()=>count++}>+</button>

`;

  onMount(() => {
    repl.set({
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: code_1,
        },
      ],
    });
  });
</script>

<style>

</style>

<Repl bind:this={repl} workersUrl="workers" />
