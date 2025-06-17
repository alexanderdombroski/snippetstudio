import * as vscode from 'vscode';
import { CommandMap } from '../types/commandTypes';

function initSnippetUICommands(context: vscode.ExtensionContext, commandMap: CommandMap) {
	// Show Snippets view
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.openView', () => {
			vscode.commands.executeCommand('workbench.view.extension.snippet-manager-view');
		})
	);

	// Open Settings
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.openSettings', () => {
			vscode.commands.executeCommand(
				'workbench.action.openSettings',
				'@ext:alexdombroski.snippetstudio'
			);
		})
	);

	// Snippets Refresh
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.refresh', () => {
			commandMap['snippetstudio.refresh']();
		})
	);
	// Locations Refresh
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.refreshLocations', () => {
			commandMap['snippetstudio.refreshLocations']();
		})
	);
}

export default initSnippetUICommands;
