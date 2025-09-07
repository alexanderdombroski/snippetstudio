import type { ExtensionContext } from 'vscode';
import { registerCommand, executeCommand, openExternal, Uri } from '../vscode';

async function initSnippetGistsCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.github.export', async () => {
			const { createGist } = await import('../git/snippetGists.js');
			createGist(context);
		}),
		registerCommand('snippetstudio.github.import', async () => {
			const { importGist } = await import('../git/snippetGists.js');
			await importGist(context);
			executeCommand('snippetstudio.refreshLocations');
		}),
		registerCommand('snippetstudio.github.browse', async () => {
			const targetUri = Uri.parse(
				'https://gist.github.com/search?q=snippetstudio+extension%3A.code-snippets&ref=searchresults'
			);
			openExternal(targetUri);
		})
	);
}

export default initSnippetGistsCommands;
