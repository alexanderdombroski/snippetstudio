// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SnippetViewProvider } from './ui/snippetPanel.js';
import initSnippetCommands from './commands/snippetCommands.js';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	initSnippetCommands(context);

	// Create and register the Tree View
    const treeDataProvider = new SnippetViewProvider();
    vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
