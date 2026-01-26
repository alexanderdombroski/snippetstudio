// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import path from 'node:path';
import { getCurrentLanguage, selectLanguage } from '../../utils/language';
import { getSelection } from '../../utils/user';
import { getConfiguration, showInformationMessage } from '../../vscode';
import { editSnippet } from './startEditor';
import type { SnippetTreeItem } from '../templates';
import type { SnippetData, VSCodeSnippet } from '../../types';
import { getGlobalLangFile } from '../../utils/profile';
import { snippetBodyAsString } from '../../utils/string';

/** Started the editor for a new snippet of the current language */
export async function createGlobalSnippet() {
	const langId = getCurrentLanguage() ?? (await selectLanguage());
	if (!langId) {
		return showInformationMessage('Operation cancelled: no language selected');
	}

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
	const { readSnippet } = await import('../../snippets/updateSnippets.js');
	const snippetTitle = item.description;
	const snippet = (await readSnippet(item.path, snippetTitle)) as VSCodeSnippet;
	const langId =
		_getLangFromSnippetFilePath(item.path) ??
		(await _getLangFromScope(snippet.scope)) ??
		getCurrentLanguage() ??
		'plaintext';
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

/** Gets a languages from snippet scopes */
export async function _getLangFromScope(scopes?: string): Promise<string | undefined> {
	if (!scopes) return;
	const scopesList = scopes.split(',');
	if (scopesList.length === 1) return scopesList[0];
	const lang = getCurrentLanguage();
	if (scopesList.includes(lang as string)) return lang;
	return (await selectLanguage(scopesList)) ?? scopesList[0];
}
