// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
	SnippetViewProvider,
	LocationTreeProvider,
	SnippetEditorProvider,
	SnippetDataWebViewProvider,
	createStatusBar,
} from './ui';

import {
	initSnippetCommands,
	initSnippetEditorCommands,
	initSnippetFeatureCommands,
	initSnippetFileCommands,
	initSnippetGistsCommands,
	initSnippetUICommands,
} from './commands';

import SnippetDataManager from './snippets/snippetDataManager';
import { initGlobalStore } from './utils/context';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	if (!(await initGlobalStore(context))) {
		return;
	}

	// Create and register the Tree View
	const treeDataProvider = new SnippetViewProvider();
	vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });
	const locationTreeProvider = new LocationTreeProvider();
	vscode.window.createTreeView('location-manager', {
		treeDataProvider: locationTreeProvider,
	});

	// Create web view
	const snippetDataManager = new SnippetDataManager();
	const snippetDataView = new SnippetDataWebViewProvider(context, snippetDataManager);
	vscode.window.registerWebviewViewProvider('snippet-data', snippetDataView);
	// Startup bufferEditorManager
	const snippetEditorProvider = new SnippetEditorProvider('snippetstudio', snippetDataManager);
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider('snippetstudio', snippetEditorProvider, {
			isReadonly: false,
		})
	);

	// Register Commands
	initSnippetUICommands(context, {
		'snippetstudio.refresh': treeDataProvider.debounceRefresh.bind(treeDataProvider),
		'snippetstudio.refreshLocations':
			locationTreeProvider.debounceRefresh.bind(locationTreeProvider),
	});
	initSnippetCommands(context, snippetEditorProvider);
	initSnippetFileCommands(context);
	initSnippetEditorCommands(context, snippetEditorProvider);
	initSnippetFeatureCommands(context, snippetEditorProvider);
	initSnippetGistsCommands(context);

	createStatusBar(context);

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
