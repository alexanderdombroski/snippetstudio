import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import {
	createHandler,
	deleteHandler,
	editHandler,
	manageProfilesHandler,
	refreshHandler,
	runHandler,
} from './handlers';

/** Registers and lazy loads all shell snippet commands */
export default function initSnippetShellCommands(context: ExtensionContext) {
	context.subscriptions.push(
		registerCommand('snippetstudio.shell.create', createHandler),
		registerCommand('snippetstudio.shell.edit', editHandler),
		registerCommand('snippetstudio.shell.delete', deleteHandler),
		registerCommand('snippetstudio.shell.run', runHandler),
		registerCommand('snippetstudio.shell.refresh', refreshHandler),
		registerCommand('snippetstudio.shell.manageProfiles', manageProfilesHandler)
	);
}
