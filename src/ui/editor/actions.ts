// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import path from 'node:path';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import { getSelection } from '../../utils/user';
import { getConfiguration } from '../../vscode';
import { editSnippet } from './startEditor';
import type { SnippetTreeItem } from '../templates';
import type { SnippetData, VSCodeSnippet } from '../../types';
import { getGlobalLangFile } from '../../utils/profile';
import { snippetBodyAsString } from '../../utils/string';

/** Started the editor for a new snippet of the current language */
export async function createGlobalSnippet() {
	const langId = getCurrentLanguage() ?? (await selectLanguage()) ?? 'plaintext';

	await editSnippet(
		langId,
		{
			filename: await getGlobalLangFile(langId),
			snippetTitle: '',
			prefix: _defaultPrefix(),
		},
		(await getSelection()) ?? ''
	);
}

/** snippetstudio.snippet.createAt command handler */
export async function createSnippetAt(filepath: string) {
	const langId =
		_getLangFromSnippetFilePath(filepath) ??
		(await selectLanguage()) ??
		getCurrentLanguage() ??
		'plaintext';

	await editSnippet(
		langId,
		{
			filename: filepath,
			snippetTitle: '',
			prefix: _defaultPrefix(),
			scope: langId,
		},
		(await getSelection()) ?? ''
	);
}

/** start editing a new snippet from the selection */
export async function createSnippetFromSelection() {
	const langId = getCurrentLanguage() ?? 'plaintext';
	const filename = await getGlobalLangFile(langId);

	await editSnippet(
		langId,
		{
			filename,
			snippetTitle: '',
			prefix: _defaultPrefix(),
		},
		(await getSelection()) ?? ''
	);
}

/** edit existing snippet */
export async function editExistingSnippet(item: SnippetTreeItem) {
	const langId = getCurrentLanguage() ?? 'plaintext';
	const snippetTitle = item.description;
	const { readSnippet } = await import('../../snippets/updateSnippets.js');
	const snippet = (await readSnippet(item.path, snippetTitle)) as VSCodeSnippet;
	const snippetData: SnippetData = {
		...snippet,
		filename: item.path,
		snippetTitle,
	};

	const body = snippetBodyAsString(snippet?.body);
	await editSnippet(langId, snippetData, body);
}

// -------------------- UTILS -------------------- //

/** gets default snippet prefix from configuration */
export function _defaultPrefix(): string {
	return getConfiguration('snippetstudio')?.get<string>('defaultSnippetPrefix') ?? '';
}

/** attempts to return a language identifier from the snippet filepath */
export function _getLangFromSnippetFilePath(filepath: string): string | undefined {
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
