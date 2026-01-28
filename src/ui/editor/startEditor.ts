// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { ExtensionContext, Uri as UriType } from 'vscode';
import vscode, {
	getConfiguration,
	openTextDocument,
	showErrorMessage,
	showTextDocument,
	Uri,
} from '../../vscode';
import path from 'node:path';
import SnippetDataManager from './SnippetDataManager';
import SnippetDataWebViewProvider from './SnippetDataWebViewProvider';
import SnippetEditorProvider from './SnippetEditorProvider';
import initSnippetEditorCommands from './snippetEditor';
import initSnippetFeatureCommands from './snippetFeatures';
import type { SnippetData } from '../../types';
import { getExtensionContext } from '../../utils/context';

let snippetEditorProvider: SnippetEditorProvider | undefined;

/** completes all setup of editor, snippet data view, and commands */
export async function _initEditing(context: ExtensionContext): Promise<SnippetEditorProvider> {
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

/** start up a new buffer editor to create/edit a snippet */
async function editSnippet(langId: string, snippetData: SnippetData, body: string = '') {
	const context = getExtensionContext();
	try {
		if (getConfiguration('snippetstudio').get<boolean>('autoCreateSnippetFiles')) {
			const { createFile } = await import('../../snippets/newSnippetFile.js');
			const status = await createFile(snippetData.filename, false);
			if (status === 'skipped') {
				return;
			}
		}
		const provider = await _initEditing(context);
		if (
			getConfiguration('snippetstudio').get<boolean>('editor.autoEscapeDollarSignsFromSelection')
		) {
			body = _escapeAllSnippetInsertionFeatures(body);
		}
		const uri = _newSnippetEditorUri(
			langId,
			path.extname(snippetData.filename) === '.code-snippets'
		);
		await provider.mountSnippet(uri, snippetData, body);
		const doc = await openTextDocument(uri);
		vscode.languages.setTextDocumentLanguage(doc, langId);
		await showTextDocument(doc, {
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
		showErrorMessage(`Error creating temp editor: ${error}`);
		return undefined;
	}
}

let editorCount = 0;

/** create a new editor uri */
export function _newSnippetEditorUri(
	langId: string = 'plaintext',
	showScope: boolean = true
): UriType {
	return Uri.from({
		scheme: 'snippetstudio',
		path: `/snippets/snippet-${++editorCount}`,
		query: `type=${langId}&showScope=${showScope}`,
	});
}

/** Escapes all instances of placholders and tabstops */
export function _escapeAllSnippetInsertionFeatures(str: string): string {
	// Escape tabstops
	let escapedString = str.replace(/\$(\d+)/g, '\\$$$1');

	// Escape choice/placeholder
	escapedString = escapedString.replace(/\$\{(\d+)(\||:)/g, '\\$${$1$2');

	return escapedString;
}

export { editSnippet };
