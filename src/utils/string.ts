/** makes space delimited words become title case */
function titleCase(str: string): string {
	return str
		.split(' ')
		.map((w) => capitalize(w))
		.join(' ');
}

/** capitalizes the first letter of a string */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/** ensures a snippet code is formatted as a string */
function snippetBodyAsString(body: string | string[] | null | undefined) {
	return Array.isArray(body) ? body.join('\n') : (body ?? '');
}

export { titleCase, snippetBodyAsString, capitalize };
