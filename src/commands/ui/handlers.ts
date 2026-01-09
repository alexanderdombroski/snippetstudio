import { executeCommand, openExternal, Uri, createTerminal, ThemeIcon } from '../../vscode';
import type { SnippetCategoryDropdown } from '../../ui/templates';

/** snippetstudio.openView command handler */
export function openViewHandler() {
	executeCommand('workbench.view.extension.snippet-manager-view');
}

/** snippetstudio.openSettings command handler */
export function openSettingsHandler() {
	executeCommand('workbench.action.openSettings', '@ext:alexdombroski.snippetstudio');
}

/** snippetstudio.file.open.Explorer command handler */
export function openExplorerHandler(treeItem: SnippetCategoryDropdown) {
	openExternal(Uri.file(treeItem.folderPath));
}

/** snippetstudio.file.open.Terminal command handler */
export function openTerminalHandler(treeItem: SnippetCategoryDropdown) {
	const terminal = createTerminal({
		name: 'Global Snippets',
		cwd: treeItem.folderPath,
		iconPath: new ThemeIcon('repo'),
	});
	terminal.show();
}
