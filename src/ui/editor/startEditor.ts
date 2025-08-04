// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import vscode from '../../vscode';
import path from 'node:path';
import SnippetDataManager from './SnippetDataManager';
import SnippetDataWebViewProvider from './SnippetDataWebViewProvider';
import SnippetEditorProvider from './SnippetEditorProvider';
import initSnippetEditorCommands from './snippetEditor';
import initSnippetFeatureCommands from './snippetFeatures';
import type { SnippetData } from '../../types';

let snippetEditorProvider: SnippetEditorProvider | undefined;

async function initEditing(context: vscode.ExtensionContext): Promise<SnippetEditorProvider> {
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

async function editSnippet(
	context: vscode.ExtensionContext,
	langId: string,
	snippetData: SnippetData,
	body: string = ''
) {
	try {
		if (vscode.workspace.getConfiguration('snippetstudio').get<boolean>('autoCreateSnippetFiles')) {
			const { createFile } = await import('../../snippets/newSnippetFile.js');
			const status = await createFile(snippetData.filename, false);
			if (status === 'skipped') {
				return;
			}
		}
		const provider = await initEditing(context);

		if (
			vscode.workspace
				.getConfiguration('snippetstudio')
				.get<boolean>('editor.autoEscapeDollarSignsFromSelection')
		) {
			body = escapeAllSnippetInsertionFeatures(body);
		}
		const uri = newSnippetEditorUri(
			langId,
			path.extname(snippetData.filename) === '.code-snippets'
		);
		await provider.mountSnippet(uri, snippetData, body);
		const doc = await vscode.workspace.openTextDocument(uri);
		vscode.languages.setTextDocumentLanguage(doc, langId);
		await vscode.window.showTextDocument(doc, {
			viewColumn: vscode.ViewColumn.Active,
			preview: false,
		});
		vscode.workspace.onDidCloseTextDocument((document) => {
			if (document.uri === doc.uri) {
				provider.delete(doc.uri);
			}
		});
		return doc;
	} catch (error) {
		vscode.window.showErrorMessage(`Error creating temp editor: ${error}`);
		return undefined;
	}
}

let editorCount = 0;

function newSnippetEditorUri(langId: string = 'plaintext', showScope: boolean = true): vscode.Uri {
	return vscode.Uri.from({
		scheme: 'snippetstudio',
		path: `/snippets/snippet-${++editorCount}`,
		query: `type=${langId}&showScope=${showScope}`,
	});
}

/**
 * Escapes all instances of placholders and tabstops
 */
function escapeAllSnippetInsertionFeatures(str: string): string {
	// Escape tabstops
	let escapedString = str.replace(/\$(\d+)/g, '\\$$$1');

	// Escape choice/placeholder
	escapedString = escapedString.replace(/\$\{(\d+)(\||:)/g, '\\$${$1$2');

	return escapedString;
}

export { editSnippet };
