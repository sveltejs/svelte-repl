import resolve from "rollup-plugin-node-resolve";
import json from "rollup-plugin-json";
import { terser } from "rollup-plugin-terser";

import svelte from "rollup-plugin-svelte";
import livereload from "rollup-plugin-livereload";
import css from "rollup-plugin-css-only";
import commonjs from "@rollup/plugin-commonjs";

const production = !process.env.ROLLUP_WATCH;

const demoConfig = {
  input: "demo/main.js",
  output: {
    sourcemap: true,
    format: "esm",
    name: "app",
    dir: "demo/build",
  },
  plugins: [
    svelte({
      dev: !production,
      css: (css) => {
        css.write("demo/build/bundle.css");
      },
    }),

    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    css({ output: "demo/build/vendor.css" }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload("demo"),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require("child_process").spawn("sirv", ["demo"], {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        });
      }
    },
  };
}

// bundle workers
const workerConfig = ["compiler", "bundler"].map((x) => ({
  input: `src/workers/${x}/index.js`,
  output: {
    file: `demo/workers/${x}.js`,
    format: "iife",
  },
  plugins: [resolve(), json(), production && terser()],
}));

export default [...workerConfig, demoConfig];
