import * as vscode from 'vscode';

async function initSnippetGistsCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.github.export', async () => {
			const { createGist } = await import('../snippets/snippetGists.js');
			createGist(context);
		}),
		vscode.commands.registerCommand('snippetstudio.github.import', async () => {
			const { importGist } = await import('../snippets/snippetGists.js');
			await importGist(context);
			vscode.commands.executeCommand('snippetstudio.refreshLocations');
		}),
		vscode.commands.registerCommand('snippetstudio.github.browse', async () => {
			const targetUri = vscode.Uri.parse(
				'https://gist.github.com/search?q=snippetstudio+extension%3A.code-snippets&ref=searchresults'
			);
			vscode.env.openExternal(targetUri);
		})
	);
}

export default initSnippetGistsCommands;
