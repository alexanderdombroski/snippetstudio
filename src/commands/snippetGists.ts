import * as vscode from 'vscode';
import { createGist, importGist } from '../snippets/snippetGists';

async function initSnippetGistsCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.github.export', () => {
			createGist(context);
		}),
		vscode.commands.registerCommand('snippetstudio.github.import', async () => {
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
