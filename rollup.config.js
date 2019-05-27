import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

// bundle workers
export default ['compiler', 'bundler'].map(x => ({
	input: `src/workers/${x}/index.js`,
	output: {
		file: `workers/${x}.js`,
		format: 'iife'
	},
	plugins: [
		resolve(),
		commonjs(),
		terser()
	]
}));