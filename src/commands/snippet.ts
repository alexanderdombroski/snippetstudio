import * as vscode from 'vscode';
import onDoubleClick from './doubleClickHandler';
import type { TreePathItem } from '../ui/templates';
import { getCurrentLanguage, selectLanguage } from '../utils/language';
import { getLangFromSnippetFilePath } from '../utils/fsInfo';
import path from 'path';
import type { SnippetData, VSCodeSnippet } from '../types';
import { getConfirmation, getSelection, chooseSnippetFile } from '../utils/user';
import { escapeAllSnippetInsertionFeatures, snippetBodyAsString } from '../utils/string';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import { getGlobalLangFile, getKeybindingsFilePath } from '../utils/profile';
import { getExtensionSnippetLangs } from '../snippets/extension';

function initSnippetCommands(context: vscode.ExtensionContext) {
	// Show Snippet Body
	const showSnippetOnDoubleClick = onDoubleClick((item: TreePathItem) => {
		vscode.window.showInformationMessage(item.tooltip?.toString() ?? '');
	});
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.showBody', (item: TreePathItem) => {
			showSnippetOnDoubleClick(item);
		})
	);

	// Add Global
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.addGlobal', async () => {
			const langId = getCurrentLanguage() ?? 'plaintext';

			await editSnippet(
				context,
				langId,
				{
					filename: await getGlobalLangFile(langId),
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
			async (item: TreePathItem) => {
				const filename = item.path;
				const langId =
					getLangFromSnippetFilePath(filename) ??
					(await selectLanguage()) ??
					getCurrentLanguage() ??
					'plaintext';

				await editSnippet(
					context,
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
				const filename = await getGlobalLangFile(langId);

				await editSnippet(
					context,
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
		vscode.commands.registerCommand('snippetstudio.snippet.edit', async (item: TreePathItem) => {
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
			const body = snippetBodyAsString(snippet?.body);
			await editSnippet(context, langId, snippetData, body);
			vscode.commands.executeCommand('snippetstudio.refresh');
		})
	);
	// Delete Snippet
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.delete', async (item: TreePathItem) => {
			if (
				vscode.workspace.getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
				!(await getConfirmation(`Are you sure you want to delete "${item.description}"?`))
			) {
				return;
			}

			const { deleteSnippet } = await import('../snippets/updateSnippets.js');
			deleteSnippet(item.path, String(item.description));
			vscode.commands.executeCommand('snippetstudio.refresh');
		})
	);
	// Move Snippet
	context.subscriptions.push(
		vscode.commands.registerCommand('snippetstudio.snippet.move', async (item: TreePathItem) => {
			const [actives, locals, profiles] = await locateAllSnippetFiles();
			const profileFiles = Object.values(profiles)
				.map((files) => files)
				.flat();
			const files = [...actives, ...locals, ...profileFiles];
			const options = files
				.filter((file) => file !== item.path)
				.map((file) => ({
					label: path.basename(file),
					description: file,
				}));
			const selected = await vscode.window.showQuickPick(options, {
				title: 'Pick a snippet file to move the snippet to',
			});
			if (selected === undefined) {
				return;
			}

			const snippetTitle = item.description?.toString() ?? '';
			const { readSnippet, writeSnippet } = await import('../snippets/updateSnippets.js');
			const snippet = (await readSnippet(item.path, snippetTitle)) as VSCodeSnippet;

			await Promise.all([
				writeSnippet(selected.description, snippetTitle, snippet),
				vscode.commands.executeCommand('snippetstudio.snippet.delete', item),
			]);
			vscode.commands.executeCommand('snippetstudio.refresh');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.snippet.addKeybinding',
			async (item: TreePathItem) => {
				const keyBindPath = await getKeybindingsFilePath();

				const snippetTitle = item.description?.toString() ?? '';
				const { readSnippet } = await import('../snippets/updateSnippets.js');
				const [snippet, keybindings] = await Promise.all([
					readSnippet(item.path, snippetTitle) as Promise<VSCodeSnippet>,
					readJsonC(keyBindPath),
				]);

				const langs: string[] = (snippet?.scope ?? getCurrentLanguage() ?? 'plaintext').split(',');
				const placeholder = 'INSERT_KEY_BINDING_HERE';
				(keybindings as Object[]).push({
					key: placeholder,
					command: 'editor.action.insertSnippet',
					when: `editorTextFocus && (${langs.map((lang) => `editorLangId == ${lang}`).join(' || ')})`,
					args: {
						snippet: snippetBodyAsString(snippet.body),
					},
				});

				await writeJson(keyBindPath, keybindings);
				const doc = await vscode.workspace.openTextDocument(keyBindPath);
				const editor = await vscode.window.showTextDocument(doc);
				await vscode.commands.executeCommand('workbench.action.files.revert');

				const text = doc.getText();
				const index = text.indexOf(placeholder);
				if (index === -1) {
					return;
				}
				const position = doc.positionAt(index);
				const range = new vscode.Range(position, position.translate(0, placeholder.length));
				editor.selection = new vscode.Selection(range.start, range.end);
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
			}
		)
	);

	// Extension Snippet Commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			'snippetstudio.extension.modify',
			async (item: TreePathItem) => {
				const langs = await getExtensionSnippetLangs(item.path);
				const savePath = await chooseSnippetFile(langs);
				if (savePath === undefined) {
					return;
				}

				const snippetTitle = item.description?.toString() ?? '';
				const { readSnippet } = await import('../snippets/updateSnippets.js');
				const snippet = await readSnippet(item.path, snippetTitle, true);
				const snippetData: SnippetData = {
					filename: savePath,
					snippetTitle,
					prefix: item.label,
					description: snippet?.description ?? '',
				};
				if (savePath.includes('.code-snippets')) {
					snippetData.scope = langs.join(',');
				}

				const active = String(getCurrentLanguage());
				const langId = langs.includes(active) ? active : langs[0];

				await editSnippet(context, langId, snippetData, snippetBodyAsString(snippet?.body));
				vscode.commands.executeCommand('snippetstudio.refresh');
			}
		)
	);
}

async function editSnippet(
	context: vscode.ExtensionContext,
	langId: string,
	snippetData: SnippetData,
	body: string = ''
) {
	try {
		const { initEditing } = await import('../editor/initEditing.js');
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

function defaultPrefix(): string {
	return (
		vscode.workspace.getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ?? ''
	);
}

let editorCount = 0;

function newSnippetEditorUri(langId: string = 'plaintext', showScope: boolean = true): vscode.Uri {
	return vscode.Uri.from({
		scheme: 'snippetstudio',
		path: `/snippets/snippet-${++editorCount}`,
		query: `type=${langId}&showScope=${showScope}`,
	});
}

export default initSnippetCommands;
