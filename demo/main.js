import Repl from "../src/Repl.svelte";

const app = new Repl({
  target: document.body,
  props: {
    workersUrl: "/workers",
    svelteUrl: "https://unpkg.com/svelte@latest",
    rollupUrl: `https://unpkg.com/rollup@1/dist/rollup.browser.js`,
    relaxed: true,
  },
});

const defaultComponent = {
  name: "App",
  type: "svelte",
  source: `<script>
  let name = 'world';
</script>

<h1>Hello {name}!</h1>
`,
};

const data = {
  components: [defaultComponent],
};

app.set(data);
