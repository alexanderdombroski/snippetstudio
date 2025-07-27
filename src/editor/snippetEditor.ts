import * as vscode from 'vscode';
import type SnippetEditorProvider from './bufferEditor';
import { getCurrentUri } from '../utils/fsInfo';
import type { VSCodeSnippet } from '../types';
import { titleCase } from '../utils/string';

function initSnippetEditorCommands(
	context: vscode.ExtensionContext,
	provider: SnippetEditorProvider
) {
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.editor.save', async () => {
			if (vscode.window.activeTextEditor?.document.uri.scheme === 'snippetstudio') {
				const body = vscode.window.activeTextEditor.document.getText().split(/\r\n|\r|\n/);
				const data = provider.getSnippetData();
				if (data === undefined) {
					vscode.window.showErrorMessage('Cannot save snippet without snippet data');
					return;
				}
				const prefix =
					!Array.isArray(data.prefix) && data.prefix.includes(',')
						? data.prefix.trim().split(',')
						: data.prefix;
				const snippet: VSCodeSnippet = { prefix, body };
				if (data.description) {
					snippet.description = data.description.trim();
				}
				if (data.scope) {
					snippet.scope = data.scope.trim();
				}
				const capitalize = vscode.workspace
					.getConfiguration('snippetstudio')
					.get<boolean>('autoCapitalizeSnippetName');

				if (
					vscode.workspace.getConfiguration('snippetstudio').get<boolean>('autoCreateSnippetFiles')
				) {
					const { createFile } = await import('../snippets/newSnippetFile.js');
					await createFile(data.filename, false);
				}
				const { writeSnippet } = await import('../snippets/updateSnippets.js');
				writeSnippet(
					data.filename,
					capitalize ? titleCase(data.snippetTitle.trim()) : data.snippetTitle.trim(),
					snippet
				);
				vscode.commands.executeCommand('workbench.action.closeActiveEditor');
				vscode.commands.executeCommand('snippetstudio.refresh');
			}
		}),
		vscode.commands.registerCommand('snippetstudio.editor.cancel', () => {
			const uri = getCurrentUri();

			if (uri) {
				provider.delete(uri);
				vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			}
		})
	);

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		vscode.commands.executeCommand(
			'setContext',
			'snippetstudio.editorVisible',
			editor?.document.uri.scheme === 'snippetstudio'
		);
	});
}

export default initSnippetEditorCommands;
