// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SnippetViewProvider } from './ui/snippetPanel.mjs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.openView', () => {
			vscode.commands.executeCommand('workbench.view.extension.snippet-manager-view');
		})
	);
	context.subscriptions.push(vscode.commands.registerCommand('snippetstudio.showSnippetBody', (body: string) => {
        // Display the snippet body (e.g., in an information message or a webview)
        vscode.window.showInformationMessage(body); // Example: Display in an info message
    }));


	// Create and register the Tree View
    const treeDataProvider = new SnippetViewProvider();
    vscode.window.createTreeView('snippet-manager-view', { treeDataProvider });

	console.log('The extension "snippetstudio" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {}
