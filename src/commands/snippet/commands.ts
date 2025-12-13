import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import { onDoubleClick } from '../utils';
import {
	showBodyHandler,
	addGlobalHandler,
	createAtHandler,
	fromSelectionHandler,
	editHandler,
	deleteSnippetHandler,
	moveHandler,
	addKeybindingHandler,
} from './handlers';

/** register all snippet creation commands */
function initSnippetCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.showBody', onDoubleClick(showBodyHandler)),
		registerCommand('snippetstudio.snippet.addGlobal', addGlobalHandler),
		registerCommand('snippetstudio.snippet.createAt', createAtHandler),
		registerCommand('snippetstudio.snippet.fromSelection', fromSelectionHandler),
		registerCommand('snippetstudio.snippet.edit', editHandler),
		registerCommand('snippetstudio.snippet.delete', deleteSnippetHandler),
		registerCommand('snippetstudio.snippet.move', moveHandler),
		registerCommand('snippetstudio.snippet.addKeybinding', addKeybindingHandler)
	);
}

export default initSnippetCommands;
