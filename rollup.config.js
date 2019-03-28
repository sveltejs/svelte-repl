import fs from 'fs';
import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

// this is a bit of a hack
const srcdoc = fs.readFileSync('src/Output/srcdoc.html', 'utf-8');
fs.writeFileSync('src/Output/srcdoc.js', `export default ${JSON.stringify(srcdoc)};`);

export default [
	// tests
	{
		input: 'test/src/index.js',
		output: {
			file: 'test/public/bundle.js',
			format: 'iife'
		},
		plugins: [
			resolve(),
			commonjs(),
			svelte()
		]
	}
];