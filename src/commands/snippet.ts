import vscode, {
	registerCommand,
	executeCommand,
	showInformationMessage,
	getConfiguration,
} from '../vscode';
import onDoubleClick from './doubleClickHandler';
import type { TreePathItem } from '../ui/templates';
import { getCurrentLanguage, selectLanguage } from '../utils/language';
import path from 'node:path';
import type { SnippetData, VSCodeSnippet } from '../types';
import { getConfirmation, getSelection } from '../utils/user';
import { snippetBodyAsString } from '../utils/string';
import { getGlobalLangFile } from '../utils/profile';

function initSnippetCommands(context: vscode.ExtensionContext) {
	// Show Snippet Body
	const showSnippetOnDoubleClick = onDoubleClick((item: TreePathItem) => {
		showInformationMessage(item.tooltip?.toString() ?? '');
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
				getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
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
			const { moveSnippet } = await import('../snippets/updateSnippets.js');
			await moveSnippet(item);
			executeCommand('snippetstudio.refresh');
		})
	);

	context.subscriptions.push(
		registerCommand('snippetstudio.snippet.addKeybinding', async (item: TreePathItem) => {
			const { promptAddKeybinding } = await import('../snippets/keyBindings.js');
			await promptAddKeybinding(item);
		})
	);

	// Extension Snippet Commands
	context.subscriptions.push(
		registerCommand('snippetstudio.extension.modify', async (item: TreePathItem) => {
			const { extractAndModify } = await import('../snippets/extension/transfer.js');
			await extractAndModify(item, context);
			executeCommand('snippetstudio.refresh');
		})
	);
}

function defaultPrefix(): string {
	return getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ?? '';
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
