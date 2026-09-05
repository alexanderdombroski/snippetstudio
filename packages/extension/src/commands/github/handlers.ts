import { openExternal, Uri } from '../../vscode';
import { refreshAll } from '../utils';

/** snippetstudio.github.export command handler */
export async function exportHandler() {
	const { createGist } = await import('../../git/snippetGists.js');
	await createGist();
}

/** snippetstudio.github.import command handler */
export async function importHandler() {
	const { importGist } = await import('../../git/snippetGists.js');
	await importGist();
	refreshAll();
}

/** snippetstudio.github.browse command handler */
export async function browseHandler() {
	const targetUri = Uri.parse(
		'https://gist.github.com/search?q=snippetstudio+extension%3A.code-snippets&ref=searchresults'
	);
	await openExternal(targetUri);
}
