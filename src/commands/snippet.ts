import * as vscode from 'vscode';
import onDoubleClick from './doubleClickHandler';
import { TreeSnippet } from '../ui/templates';
import { getCurrentLanguage, selectLanguage } from '../utils/language';
import SnippetEditorProvider from '../ui/bufferEditor';
import { newSnippetEditorUri } from './snippetEditor';
import { getGlobalLangFile, getLangFromSnippetFilePath } from '../utils/fsInfo';
import path from 'path';
import { SnippetData } from '../types/snippetTypes';
import { getConfirmation, getSelection } from '../utils/user';
import { escapeAllSnippetInsertionFeatures } from '../utils/string';

function initSnippetCommands(
	context: vscode.ExtensionContext,
	snippetEditorProvider: SnippetEditorProvider
) {
	// Show Snippet Body
	const showSnippetOnDoubleClick = onDoubleClick((item: vscode.TreeItem) => {
		vscode.window.showInformationMessage(item.tooltip?.toString() ?? '');
	});
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.snippet.showBody',
			(item: vscode.TreeItem) => {
				showSnippetOnDoubleClick(item);
			}
		)
	);

	// Add Global
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.addGlobal', async () => {
			const langId = getCurrentLanguage() ?? 'plaintext';

			await editSnippet(
				snippetEditorProvider,
				langId,
				{
					filename: getGlobalLangFile(langId),
					snippetTitle: '',
					prefix: defaultPrefix(),
				},
				(await getSelection()) ?? ''
			);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.file.createSnippetAt',
			async (item: TreeSnippet) => {
				if (item === undefined || item.description === undefined) {
					return;
				}
				const filename = item.description.toString();
				const langId =
					getLangFromSnippetFilePath(filename) ??
					(await selectLanguage()) ??
					getCurrentLanguage() ??
					'plaintext';

				await editSnippet(
					snippetEditorProvider,
					langId,
					{
						filename,
						snippetTitle: '',
						prefix: defaultPrefix(),
						scope: langId,
					},
					(await getSelection()) ?? ''
				);
			}
		)
	);
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.snippet.createGlobalLangSnippetFromSelection',
			async () => {
				const langId = getCurrentLanguage() ?? 'plaintext';
				const filename = getGlobalLangFile(langId);

				await editSnippet(
					snippetEditorProvider,
					langId,
					{
						filename,
						snippetTitle: '',
						prefix: defaultPrefix(),
					},
					(await getSelection()) ?? ''
				);
			}
		)
	);
	// Edit Snippet
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.edit', async (item: TreeSnippet) => {
			const langId = getCurrentLanguage() ?? 'plaintext';
			const snippetTitle = item.description?.toString() ?? '';
			const { readSnippet } = await import('../snippets/updateSnippets.js');
			const snippet = await readSnippet(item.path, snippetTitle);
			const snippetData: SnippetData = {
				filename: item.path,
				snippetTitle,
				prefix: item.label,
			};
			if (snippet) {
				if (snippet.description) {
					snippetData.description = snippet.description;
				}
				if (snippet.scope) {
					snippetData.scope = snippet.scope;
				}
			}
			const body = Array.isArray(snippet?.body)
				? snippet.body.join('\n')
				: (snippet?.body ?? '');
			await editSnippet(snippetEditorProvider, langId, snippetData, body);
		})
	);
	// Delete Snippet
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.snippet.delete',
			async (item: TreeSnippet) => {
				if (item === undefined || item.description === undefined) {
					return;
				}
				if (
					vscode.workspace
						.getConfiguration('snippetstudio')
						.get<boolean>('confirmSnippetDeletion') &&
					!(await getConfirmation(
						`Are you sure you want to delete "${item.description}"?`
					))
				) {
					return;
				}

				const { deleteSnippet } = await import('../snippets/updateSnippets.js');
				deleteSnippet(item.path, item.description.toString());
				vscode.commands.executeCommand('snippetstudio.refresh');
			}
		)
	);
}

async function editSnippet(
	provider: SnippetEditorProvider,
	langId: string,
	snippetData: SnippetData,
	body: string = ''
) {
	try {
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

function defaultPrefix(): string {
	return (
		vscode.workspace.getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ??
		''
	);
}

export default initSnippetCommands;
