// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import SnippetViewProvider from './ui/snippetView.js';
import LocationTreeProvider from './ui/locationView.js';

import initSnippetCommands from './commands/snippet.js';
import initSnippetFileCommands from './commands/snippetFile.js';
import initSnippetUICommands from './commands/snippetUI.js';
import initSnippetEditorCommands from './commands/snippetEditor.js';

import SnippetEditorProvider from './ui/bufferEditor.js';
import SnippetDataWebViewProvider from './ui/snippetDataView.js';
import SnippetDataManager from './snippets/snippetDataManager.js';
import createStatusBar from './ui/statusBar.js';
import initSnippetFeatureCommands from './commands/snippetFeatures.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Create and register the Tree View
    const treeDataProvider = new SnippetViewProvider();
    vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });
    const locationTreeProvider = new LocationTreeProvider();
	vscode.window.createTreeView('location-manager', { treeDataProvider: locationTreeProvider });
	
	// Create web view
	const snippetDataManager = new SnippetDataManager();
	const snippetDataView = new SnippetDataWebViewProvider(context, snippetDataManager);
	vscode.window.registerWebviewViewProvider("snippet-data", snippetDataView);
	// Startup bufferEditorManager
	const snippetEditorProvider = new SnippetEditorProvider("snippetstudio", snippetDataManager);
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider("snippetstudio", snippetEditorProvider, {isReadonly: false})
	);

	// Register Commands
	initSnippetUICommands(context, {
		"snippetstudio.refresh": treeDataProvider.debounceRefresh.bind(treeDataProvider),
		"snippetstudio.refreshLocations": locationTreeProvider.debounceRefresh.bind(locationTreeProvider)
	});
	initSnippetCommands(context, snippetEditorProvider);
	initSnippetFileCommands(context);
	initSnippetEditorCommands(context, snippetEditorProvider);
	initSnippetFeatureCommands(context, snippetEditorProvider);

	createStatusBar(context);

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
