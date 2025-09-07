import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../vscode';
import { refreshAll } from './snippetFile';
import type { TreePathItem } from '../ui/templates';

async function initSnippetLinkCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.file.link', async (item: TreePathItem) => {
			const { manageLinkLocations } = await import('../snippets/links/commands.js');
			await manageLinkLocations(!!item.contextValue?.includes('linked'), item.path);
			refreshAll();
		})
	);
}

export default initSnippetLinkCommands;
