import type { ExtensionContext } from 'vscode';
import {
	registerCommand,
	executeCommand,
	openExternal,
	Uri,
	createTerminal,
	ThemeIcon,
} from '../vscode';
import type { CommandMap } from '../types';
import type { SnippetCategoryTreeItem } from '../ui/templates';

/** register ui related commands */
function initSnippetUICommands(context: ExtensionContext, commandMap: CommandMap) {
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
			openExternal(Uri.file(treeItem.folderPath));
		}),
		registerCommand('snippetstudio.file.open.Terminal', (treeItem: SnippetCategoryTreeItem) => {
			const terminal = createTerminal({
				name: 'Global Snippets',
				cwd: treeItem.folderPath,
				iconPath: new ThemeIcon('repo'),
			});
			terminal.show();
		})
	);
}

export default initSnippetUICommands;
