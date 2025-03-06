// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import SnippetViewProvider from './ui/snippetView.js';
import LocationTreeProvider from './ui/locationView.js';

import initSnippetCommands from './commands/snippet.js';
import initSnippetFileCommands from './commands/snippetFile.js';
import initSnippetUICommands from './commands/snippetUI.js';
import initSnippetEditorCommands from './commands/snippetEditor.js';
import { getFileExtensions } from './utils/language.js';
import SnippetEditorProvider from './ui/bufferEditor.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Create and register the Tree View
    const treeDataProvider = new SnippetViewProvider();
    vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });
    const locationTreeProvider = new LocationTreeProvider();
	vscode.window.createTreeView('location-manager', { treeDataProvider: locationTreeProvider });

	// Startup bufferEd
	const snippetEditorProvider = new SnippetEditorProvider("snippetstudio");
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider("snippetstudio", snippetEditorProvider, {isReadonly: false})
	);

	initSnippetUICommands(context, {
		"snippetstudio.refresh": treeDataProvider.debounceRefresh.bind(treeDataProvider),
		"snippetstudio.refreshLocations": locationTreeProvider.debounceRefresh.bind(locationTreeProvider)
	});
	initSnippetCommands(context);
	initSnippetFileCommands(context);
	initSnippetEditorCommands(context, snippetEditorProvider);

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
