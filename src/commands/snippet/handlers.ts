import path from 'node:path';
import { executeCommand, getConfiguration } from '../../vscode';
import type { TreePathItem } from '../../ui/templates';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import type { SnippetData, VSCodeSnippet } from '../../types';
import { getConfirmation, getSelection } from '../../utils/user';
import { snippetBodyAsString } from '../../utils/string';
import { getGlobalLangFile } from '../../utils/profile';

/** gets default snippet prefix from configuration */
export function defaultPrefix(): string {
	return getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ?? '';
}

/** attempts to return a language identifier from the snippet filepath */
export function getLangFromSnippetFilePath(filepath: string): string | undefined {
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

/** snippetstudio.snippet.showBody command handler */
export async function showBodyHandler(item: TreePathItem) {
	const { peekAtSnippet } = await import('../../ui/peeker/peek.js');
	await peekAtSnippet(item.path, item.description as string);
}

/** snippetstudio.snippet.addGlobal command handler */
export async function addGlobalHandler() {
	const langId = getCurrentLanguage() ?? 'plaintext';

	const { editSnippet } = await import('../../ui/editor/startEditor.js');
	await editSnippet(
		langId,
		{
			filename: await getGlobalLangFile(langId),
			snippetTitle: '',
			prefix: defaultPrefix(),
		},
		(await getSelection()) ?? ''
	);
}

/** snippetstudio.file.createSnippetAt command handler */
export async function createSnippetAtHandler(item: TreePathItem) {
	const filename = item.path;
	const langId =
		getLangFromSnippetFilePath(filename) ??
		(await selectLanguage()) ??
		getCurrentLanguage() ??
		'plaintext';

	const { editSnippet } = await import('../../ui/editor/startEditor.js');
	await editSnippet(
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

/** snippetstudio.snippet.createGlobalLangSnippetFromSelection command handler */
export async function createGlobalLangSnippetFromSelectionHandler() {
	const langId = getCurrentLanguage() ?? 'plaintext';
	const filename = await getGlobalLangFile(langId);

	const { editSnippet } = await import('../../ui/editor/startEditor.js');
	await editSnippet(
		langId,
		{
			filename,
			snippetTitle: '',
			prefix: defaultPrefix(),
		},
		(await getSelection()) ?? ''
	);
}

/** snippetstudio.snippet.edit command handler */
export async function editHandler(item: TreePathItem) {
	const langId = getCurrentLanguage() ?? 'plaintext';
	const snippetTitle = item.description?.toString() ?? '';
	const { readSnippet } = await import('../../snippets/updateSnippets.js');
	const snippet = (await readSnippet(item.path, snippetTitle)) as VSCodeSnippet;
	const snippetData: SnippetData = {
		...snippet,
		filename: item.path,
		snippetTitle,
	};

	const body = snippetBodyAsString(snippet?.body);
	const { editSnippet } = await import('../../ui/editor/startEditor.js');
	await editSnippet(langId, snippetData, body);
	executeCommand('snippetstudio.refresh');
}

/** snippetstudio.snippet.delete command handler */
export async function deleteSnippetHandler(item: TreePathItem) {
	if (
		getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
		!(await getConfirmation(`Are you sure you want to delete "${item.description}"?`))
	) {
		return;
	}

	const { deleteSnippet } = await import('../../snippets/updateSnippets.js');
	await deleteSnippet(item.path, String(item.description));
	executeCommand('snippetstudio.refresh');
}

/** snippetstudio.snippet.move command handler */
export async function moveHandler(item: TreePathItem) {
	const { moveSnippet } = await import('../../snippets/updateSnippets.js');
	await moveSnippet(item);
	executeCommand('snippetstudio.refresh');
}

/** snippetstudio.snippet.addKeybinding command handler */
export async function addKeybindingHandler(item: TreePathItem) {
	const { promptAddKeybinding } = await import('../../snippets/keyBindings.js');
	await promptAddKeybinding(item);
}
