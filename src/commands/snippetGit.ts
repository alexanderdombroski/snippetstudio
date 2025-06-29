import * as vscode from 'vscode';

async function initSnippetGitCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.github.sync', async () => {
			const { snippetSync } = await import('../git/snippetSync.js');
			await snippetSync(context);
			vscode.commands.executeCommand('snippetstudio.refresh');
			vscode.commands.executeCommand('snippetstudio.refreshLocations');
		}),
		vscode.commands.registerCommand('snippetstudio.github.merge', async () => {
			const { snippetMerge } = await import('../git/snippetMerge.js');
			await snippetMerge(context);
			vscode.commands.executeCommand('snippetstudio.refresh');
			vscode.commands.executeCommand('snippetstudio.refreshLocations');
		})
	);
}

export default initSnippetGitCommands;
