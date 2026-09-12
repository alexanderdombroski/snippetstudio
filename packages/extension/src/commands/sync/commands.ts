import type { ExtensionContext } from 'vscode';
import { registerCommand } from '../../vscode';
import { syncSetupHandler } from './handlers';

/** register all snippet sync commands */
export default function initSnippetSyncCommands(context: ExtensionContext) {
	context.subscriptions.push(registerCommand('snippetstudio.sync.setup', syncSetupHandler));
}
