import type { ExtensionContext } from 'vscode';
import vscode, { executeCommand, getConfiguration, registerCommand } from './vscode';

import { getSnippetViewProvider } from './ui/SnippetViewProvider';
import { getLocationTreeProvider } from './ui/LocationTreeProvider';

import {
	initSnippetCommands,
	initSnippetExtensionCommands,
	initSnippetFileCommands,
	initSnippetGithubCommands,
	initSnippetUICommands,
	initSnippetProfileCommands,
	initSnippetShellCommands,
} from './commands';

import { initGlobalStore } from './utils/context';
import { getShellSnippets } from './ui/shell/config';
import { initGutterLoading } from './ui/gutter/init';
import { DragAndDropController } from './ui/DragAndDropController';
import { SnippetDropProvider } from './ui/DocumentDropEditProvider';

/** This method is called when your extension is activated */
export async function activate(context: ExtensionContext) {
	if (!(await initGlobalStore(context))) {
		return;
	}

	if (vscode.env.isTelemetryEnabled) {
		const { captureEvent } = await import('./utils/analytics.js');
		captureEvent('activated', { platform: vscode.env.appName, os: process.platform });
	}

	// Reset setting
	vscode.workspace
		.getConfiguration('problems')
		.update('visibility', undefined, vscode.ConfigurationTarget.Global);

	// Close old tabs on startup
	vscode.window.tabGroups.all.forEach((group) =>
		group.tabs.forEach((tab) => {
			if (tab.input instanceof vscode.TabInputText && tab.input.uri.scheme === 'snippetstudio') {
				vscode.window.tabGroups.close(tab);
			}
		})
	);

	// Create and register the Tree View
	const treeDataProvider = getSnippetViewProvider();
	const locationTreeProvider = getLocationTreeProvider();
	context.subscriptions.push(
		registerCommand('snippetstudio.refresh', (hard?: boolean) => {
			locationTreeProvider.debounceRefresh(hard);
		})
	);

	vscode.window.createTreeView('snippet-manager-view', {
		treeDataProvider,
		dragAndDropController: new DragAndDropController('snippet-manager-view'),
	});
	vscode.window.createTreeView('location-manager', {
		treeDataProvider: locationTreeProvider,
		dragAndDropController: new DragAndDropController('location-manager'),
	});

	context.subscriptions.push(
		vscode.languages.registerDocumentDropEditProvider({ scheme: 'file' }, new SnippetDropProvider())
	);

	// Register Commands
	initSnippetUICommands(context);
	initSnippetCommands(context);
	initSnippetFileCommands(context);
	initSnippetExtensionCommands(context);
	initSnippetGithubCommands(context);
	initSnippetShellCommands(context);
	initSnippetProfileCommands(context);

	if (getShellSnippets().flat().length) {
		executeCommand('snippetstudio.shell.refresh');
	}

	if (getConfiguration('snippetstudio').get<boolean>('statusBar.showItem')) {
		const { createStatusBar } = await import('./ui/statusBar.js');
		createStatusBar(context);
	}

	initGutterLoading();

	console.log('The extension "snippetstudio" is now active!');
}

/** This method is called when your extension is deactivated */
export function deactivate() {}
