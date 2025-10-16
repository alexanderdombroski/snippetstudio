import type { ExtensionContext } from 'vscode';
import type { ShellTreeItem } from './ShellViewProvider';
import { registerCommand } from '../../vscode';
import { getShellSnippets } from './config';

/** Registers and lazy loads all shell snippet commands */
export async function initSnippetShellCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.shell.create', async () => {
			const { createShellSnippet } = await import('./handlers.js');
			createShellSnippet();
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
		})
	);

	if (getShellSnippets().flat(1).length) {
		const { getShellView } = await import('./ShellViewProvider.js');
		getShellView();
	}
}
