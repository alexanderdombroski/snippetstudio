import vscode from '../vscode';
import onDoubleClick from './doubleClickHandler';
import type { TreePathItem } from '../ui/templates';
import { getCurrentLanguage, selectLanguage } from '../utils/language';
import path from 'node:path';
import type { SnippetData, VSCodeSnippet } from '../types';
import { getConfirmation, getSelection, chooseSnippetFile } from '../utils/user';
import { snippetBodyAsString } from '../utils/string';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import { getGlobalLangFile, getKeybindingsFilePath } from '../utils/profile';
import { getExtensionSnippetLangs } from '../snippets/extension';

const { registerCommand, executeCommand } = vscode.commands;

function initSnippetCommands(context: vscode.ExtensionContext) {
	// Show Snippet Body
	const showSnippetOnDoubleClick = onDoubleClick((item: TreePathItem) => {
		vscode.window.showInformationMessage(item.tooltip?.toString() ?? '');
	});
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.showBody', (item: TreePathItem) => {
			showSnippetOnDoubleClick(item);
		})
	);

	// Add Global
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.addGlobal', async () => {
			const langId = getCurrentLanguage() ?? 'plaintext';

			const { editSnippet } = await import('../ui/editor/startEditor.js');
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
		registerCommand('snippetstudio.file.createSnippetAt', async (item: TreePathItem) => {
			const filename = item.path;
			const langId =
				getLangFromSnippetFilePath(filename) ??
				(await selectLanguage()) ??
				getCurrentLanguage() ??
				'plaintext';

			const { editSnippet } = await import('../ui/editor/startEditor.js');
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
		})
	);
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.createGlobalLangSnippetFromSelection', async () => {
			const langId = getCurrentLanguage() ?? 'plaintext';
			const filename = await getGlobalLangFile(langId);

			const { editSnippet } = await import('../ui/editor/startEditor.js');
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
		})
	);
	// Edit Snippet
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.edit', async (item: TreePathItem) => {
			const langId = getCurrentLanguage() ?? 'plaintext';
			const snippetTitle = item.description?.toString() ?? '';
			const { readSnippet } = await import('../snippets/updateSnippets.js');
			const snippet = (await readSnippet(item.path, snippetTitle)) as VSCodeSnippet;
			const snippetData: SnippetData = {
				...snippet,
				filename: item.path,
				snippetTitle,
			};

			const body = snippetBodyAsString(snippet?.body);
			const { editSnippet } = await import('../ui/editor/startEditor.js');
			await editSnippet(context, langId, snippetData, body);
			executeCommand('snippetstudio.refresh');
		})
	);
	// Delete Snippet
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.delete', async (item: TreePathItem) => {
			if (
				vscode.workspace.getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
				!(await getConfirmation(`Are you sure you want to delete "${item.description}"?`))
			) {
				return;
			}

			const { deleteSnippet } = await import('../snippets/updateSnippets.js');
			deleteSnippet(item.path, String(item.description));
			executeCommand('snippetstudio.refresh');
		})
	);
	// Move Snippet
	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.move', async (item: TreePathItem) => {
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
				executeCommand('snippetstudio.snippet.delete', item),
			]);
			executeCommand('snippetstudio.refresh');
		})
	);

	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.addKeybinding', async (item: TreePathItem) => {
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
			await executeCommand('workbench.action.files.revert');

			const text = doc.getText();
			const index = text.indexOf(placeholder);
			if (index === -1) {
				return;
			}
			const position = doc.positionAt(index);
			const range = new vscode.Range(position, position.translate(0, placeholder.length));
			editor.selection = new vscode.Selection(range.start, range.end);
			editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
		})
	);

	// Extension Snippet Commands
	context.subscriptions.push(
		registerCommand('snippetstudio.extension.modify', async (item: TreePathItem) => {
			const langs = await getExtensionSnippetLangs(item.path);
			const savePath = await chooseSnippetFile(langs);
			if (savePath === undefined) {
				return;
			}

			const snippetTitle = item.description?.toString() ?? '';
			const { readSnippet } = await import('../snippets/updateSnippets.js');
			const snippet = (await readSnippet(item.path, snippetTitle, true)) as VSCodeSnippet;
			const snippetData: SnippetData = {
				...snippet,
				filename: savePath,
				snippetTitle,
			};
			if (savePath.includes('.code-snippets')) {
				snippetData.scope = langs.join(',');
			}

			const active = String(getCurrentLanguage());
			const langId = langs.includes(active) ? active : langs[0];

			const { editSnippet } = await import('../ui/editor/startEditor.js');
			await editSnippet(context, langId, snippetData, snippetBodyAsString(snippet?.body));
			executeCommand('snippetstudio.refresh');
		})
	);
}

function defaultPrefix(): string {
	return (
		vscode.workspace.getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ?? ''
	);
}

function getLangFromSnippetFilePath(filepath: string): string | undefined {
	if (path.extname(filepath) === '.code-snippets') {
		return;
	}

	const base = path.basename(filepath);
	const dotIndex = base.indexOf('.');
	if (dotIndex === -1) {
		return;
	}

	return base.substring(0, dotIndex);
}

export default initSnippetCommands;
