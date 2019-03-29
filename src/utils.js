export function create_worker(fn) {
	const code = fn.toString().replace(/^function.+?\{/g, '').slice(0, -1);
	const blob = new Blob([code], { type:'text/javascript' });
	const url = URL.createObjectURL(blob);

	return new Worker(url);
}