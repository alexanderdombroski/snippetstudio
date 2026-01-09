import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import {
	openViewHandler,
	openSettingsHandler,
	openExplorerHandler,
	openTerminalHandler,
} from './handlers';

/** register ui related commands */
function initSnippetUICommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.openView', openViewHandler),
		registerCommand('snippetstudio.openSettings', openSettingsHandler),
		registerCommand('snippetstudio.file.open.Explorer', openExplorerHandler),
		registerCommand('snippetstudio.file.open.Terminal', openTerminalHandler)
	);
}

export default initSnippetUICommands;
