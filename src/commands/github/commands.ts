import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import { exportHandler, importHandler, browseHandler } from './handlers';

/** register github related commands */
export default function initSnippetGithubCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.github.export', exportHandler),
		registerCommand('snippetstudio.github.import', importHandler),
		registerCommand('snippetstudio.github.browse', browseHandler)
	);
}
