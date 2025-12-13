import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import {
	openHandler,
	createGlobalLangHandler,
	createProjectSnippetsHandler,
	createGlobalSnippetsHandler,
	deleteHandler,
	exportHandler,
} from './handlers';
import { onDoubleClick } from '../utils';

/** register all snippet file related commands */
export default function initSnippetFileCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.file.open', openHandler),
		registerCommand('snippetstudio.file.openFromDouble', onDoubleClick(openHandler)),
		registerCommand('snippetstudio.file.createGlobalLang', createGlobalLangHandler),
		registerCommand('snippetstudio.file.createProjectSnippets', createProjectSnippetsHandler),
		registerCommand('snippetstudio.file.createGlobalSnippets', createGlobalSnippetsHandler),
		registerCommand('snippetstudio.file.delete', deleteHandler),
		registerCommand('snippetstudio.file.export', exportHandler)
	);
}
