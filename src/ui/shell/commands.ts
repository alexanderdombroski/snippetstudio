import type { ExtensionContext } from 'vscode';
import type { ShellTreeDropdown, ShellTreeItem } from './ShellViewProvider';
import { registerCommand } from '../../vscode';
import { getShellSnippets } from './config';

/** Registers and lazy loads all shell snippet commands */
export async function initSnippetShellCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.shell.create', async (item?: ShellTreeDropdown) => {
			const { createShellSnippet } = await import('./handlers.js');
			createShellSnippet(item);
		}),
		registerCommand('snippetstudio.shell.edit', async (item: ShellTreeItem) => {
			const { editShellSnippet } = await import('./handlers.js');
			editShellSnippet(item);
		}),
		registerCommand('snippetstudio.shell.delete', async (item: ShellTreeItem) => {
			const { deleteShellSnippet } = await import('./handlers.js');
			deleteShellSnippet(item);
		}),
		registerCommand('snippetstudio.shell.run', async (item: ShellTreeItem) => {
			const { runShellSnippet } = await import('./handlers.js');
			runShellSnippet(item);
		}),
		registerCommand('snippetstudio.shell.refresh', async () => {
			const { getShellView } = await import('./ShellViewProvider.js');
			getShellView().refresh();
		})
	);

	if (getShellSnippets().flat().length) {
		const { getShellView } = await import('./ShellViewProvider.js');
		getShellView();
	}
}
