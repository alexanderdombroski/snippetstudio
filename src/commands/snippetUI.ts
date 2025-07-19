import * as vscode from 'vscode';
import { CommandMap } from '../types/commandTypes';
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';

function initSnippetUICommands(context: vscode.ExtensionContext, commandMap: CommandMap) {
	// Show Snippets view
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.openView', () => {
			vscode.commands.executeCommand('workbench.view.extension.snippet-manager-view');
		})
	);

	// Open Settings
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.openSettings', () => {
			vscode.commands.executeCommand(
				'workbench.action.openSettings',
				'@ext:alexdombroski.snippetstudio'
			);
		})
	);

	// Snippets Refresh
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.refresh', () => {
			commandMap['snippetstudio.refresh']();
		})
	);
	// Locations Refresh
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.refreshLocations', () => {
			commandMap['snippetstudio.refreshLocations']();
		})
	);

	// Open snippets file manager or terminal
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.file.openGlobals.Explorer', () => {
			const globalsPath = getGlobalSnippetFilesDir();
			if (globalsPath) {
				vscode.env.openExternal(vscode.Uri.file(globalsPath));
			}
		}),
		vscode.commands.registerCommand('snippetstudio.file.openGlobals.Terminal', () => {
			const globalsPath = getGlobalSnippetFilesDir();
			if (globalsPath) {
				const terminal = vscode.window.createTerminal({
					name: 'Global Snippets',
					cwd: globalsPath,
					iconPath: new vscode.ThemeIcon('repo'),
				});
				terminal.show();
			}
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
				vscode.commands.executeCommand(
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
