import * as vscode from 'vscode';
import SnippetDataManager from './SnippetDataManager';
import SnippetDataWebViewProvider from './SnippetDataWebViewProvider';
import SnippetEditorProvider from './SnippetEditorProvider';
import initSnippetEditorCommands from './snippetEditor';
import initSnippetFeatureCommands from './snippetFeatures';

let snippetEditorProvider: SnippetEditorProvider | undefined;

export async function initEditing(
	context: vscode.ExtensionContext
): Promise<SnippetEditorProvider> {
	if (!snippetEditorProvider) {
		const snippetDataManager = new SnippetDataManager();
		const snippetDataView = new SnippetDataWebViewProvider(context, snippetDataManager);
		vscode.window.registerWebviewViewProvider('snippet-data', snippetDataView);
		// Startup bufferEditorManager
		snippetEditorProvider = new SnippetEditorProvider('snippetstudio', snippetDataManager);
		context.subscriptions.push(
			vscode.workspace.registerFileSystemProvider('snippetstudio', snippetEditorProvider, {
				isReadonly: false,
			})
		);

		initSnippetEditorCommands(context, snippetEditorProvider);
		initSnippetFeatureCommands(context, snippetEditorProvider);
	}

	return snippetEditorProvider;
}
