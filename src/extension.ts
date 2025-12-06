import type { ExtensionContext } from 'vscode';
import vscode, { getConfiguration } from './vscode';

import SnippetViewProvider from './ui/SnippetViewProvider';
import LocationTreeProvider from './ui/LocationTreeProvider';

import {
	initSnippetCommands,
	initSnippetExtensionCommands,
	initSnippetFileCommands,
	initSnippetGithubCommands,
	initSnippetUICommands,
	initSnippetProfileCommands,
} from './commands';
import { initSnippetShellCommands } from './ui/shell/commands';

import { initGlobalStore } from './utils/context';

/** This method is called when your extension is activated */
export async function activate(context: ExtensionContext) {
	if (!(await initGlobalStore(context))) {
		return;
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
	const treeDataProvider = new SnippetViewProvider(context);
	vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });
	const locationTreeProvider = new LocationTreeProvider(context);
	vscode.window.createTreeView('location-manager', {
		treeDataProvider: locationTreeProvider,
	});

	// Register Commands
	initSnippetUICommands(context);
	initSnippetCommands(context);
	initSnippetFileCommands(context);
	initSnippetExtensionCommands(context);
	initSnippetGithubCommands(context);
	initSnippetShellCommands(context);
	initSnippetProfileCommands(context);

	if (getConfiguration('snippetstudio').get<boolean>('statusBar.showItem')) {
		const { createStatusBar } = await import('./ui/statusBar.js');
		createStatusBar(context);
	}

	console.log('The extension "snippetstudio" is now active!');
}

/** This method is called when your extension is deactivated */
export function deactivate() {}
