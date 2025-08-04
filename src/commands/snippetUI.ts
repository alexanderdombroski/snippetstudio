import vscode from '../vscode';
import type { CommandMap } from '../types';
import type { SnippetCategoryTreeItem } from '../ui/templates';

const { registerCommand, executeCommand } = vscode.commands;

function initSnippetUICommands(context: vscode.ExtensionContext, commandMap: CommandMap) {
	// Show Snippets view
	context.subscriptions.push(
		registerCommand('snippetstudio.openView', () => {
			executeCommand('workbench.view.extension.snippet-manager-view');
		})
	);

	// Open Settings
	context.subscriptions.push(
		registerCommand('snippetstudio.openSettings', () => {
			executeCommand('workbench.action.openSettings', '@ext:alexdombroski.snippetstudio');
		})
	);

	// Snippets Refresh
	context.subscriptions.push(
		registerCommand('snippetstudio.refresh', () => {
			commandMap['snippetstudio.refresh']();
		})
	);
	// Locations Refresh
	context.subscriptions.push(
		registerCommand('snippetstudio.refreshLocations', () => {
			commandMap['snippetstudio.refreshLocations']();
		})
	);

	// Open snippets file manager or terminal
	context.subscriptions.push(
		registerCommand('snippetstudio.file.open.Explorer', (treeItem: SnippetCategoryTreeItem) => {
			vscode.env.openExternal(vscode.Uri.file(treeItem.folderPath));
		}),
		registerCommand('snippetstudio.file.open.Terminal', (treeItem: SnippetCategoryTreeItem) => {
			const terminal = vscode.window.createTerminal({
				name: 'Global Snippets',
				cwd: treeItem.folderPath,
				iconPath: new vscode.ThemeIcon('repo'),
			});
			terminal.show();
		})
	);

	// Prompt a walkthrough
	!context.globalState.get<boolean>('walkthrough-completed') &&
		(async () => {
			const answer = await vscode.window.showInformationMessage(
				'New here? How about you take a look at the tutorials?',
				'Open Walkthroughs',
				"Don't ask again"
			);
			if (answer === 'Open Walkthroughs') {
				executeCommand(
					'workbench.action.openWalkthrough',
					'AlexDombroski.snippetstudio#snippetStudioWalkthrough'
				);
			}
			if (answer) {
				context.globalState.update('walkthrough-completed', true);
			}
		})();
}

export default initSnippetUICommands;
