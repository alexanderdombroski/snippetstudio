import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import { importHandler, linkHandler } from './handlers';

/** register all snippet profile related commands */
export default function initSnippetProfileCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.profile.import', importHandler),
		registerCommand('snippetstudio.profile.link', linkHandler)
	);
}
