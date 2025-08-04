import vscode, { getConfiguration } from './vscode';

import SnippetViewProvider from './ui/SnippetViewProvider';
import LocationTreeProvider from './ui/LocationTreeProvider';

import {
	initSnippetCommands,
	initSnippetFileCommands,
	initSnippetGistsCommands,
	initSnippetUICommands,
	initSnippetLinkCommands,
} from './commands';

import { initGlobalStore } from './utils/context';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	if (!(await initGlobalStore(context))) {
		return;
	}

	// Close old tabs on startup
	vscode.window.tabGroups.all.forEach((group) =>
		group.tabs.forEach((tab) => {
			if (tab.input instanceof vscode.TabInputText && tab.input.uri.scheme === 'snippetstudio') {
				vscode.window.tabGroups.close(tab);
			}
		})
	);

	// Create and register the Tree View
	const treeDataProvider = new SnippetViewProvider();
	vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });
	const locationTreeProvider = new LocationTreeProvider();
	vscode.window.createTreeView('location-manager', {
		treeDataProvider: locationTreeProvider,
	});

	// Register Commands
	initSnippetUICommands(context, {
		'snippetstudio.refresh': treeDataProvider.debounceRefresh.bind(treeDataProvider),
		'snippetstudio.refreshLocations':
			locationTreeProvider.debounceRefresh.bind(locationTreeProvider),
	});
	initSnippetCommands(context);
	initSnippetFileCommands(context);
	initSnippetGistsCommands(context);
	initSnippetLinkCommands(context);

	if (getConfiguration('snippetstudio').get<boolean>('statusBar.showItem')) {
		const { createStatusBar } = await import('./ui/statusBar.js');
		createStatusBar(context);
	}

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
