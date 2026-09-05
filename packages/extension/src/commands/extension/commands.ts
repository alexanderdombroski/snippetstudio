import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import { extractHandler, modifyHandler } from './handlers';

/** register all snippet extension related commands */
export default function initSnippetExtensionCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.extension.extract', extractHandler),
		registerCommand('snippetstudio.extension.modify', modifyHandler)
	);
}
