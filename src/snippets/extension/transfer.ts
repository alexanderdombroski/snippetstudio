// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import vscode from '../../vscode';
import path from 'node:path';
import { readSnippetFile, writeSnippetFile } from '../../utils/jsoncFilesIO';
import { chooseLocalGlobal, getFileName } from '../../utils/user';
import { getExtensionSnippetLangs } from './locate';
import { getCurrentLanguage } from '../../utils/language';
import { snippetBodyAsString } from '../../utils/string';
import type { TreePathItem } from '../../ui/templates';
import type { SnippetData, VSCodeSnippet } from '../../types';
import { findCodeSnippetsFiles, locateSnippetFiles } from '../locateSnippets';
import { getWorkspaceFolder } from '../../utils/fsInfo';
import { getActiveProfileSnippetsDir } from '../../utils/profile';

/**
 * Handler for extracting an extension snippet file
 */
async function extractAllSnippets(item: TreePathItem) {
	const basename = (await getFileName()) + '.code-snippets';
	if (basename === 'undefined.code-snippets') {
		return;
	}
	const dirname = await chooseLocalGlobal();
	if (dirname === undefined) {
		return;
	}

	const fp = path.join(dirname, basename);

	const langs = await getExtensionSnippetLangs(item.path);
	const scope = langs.join(',');

	const snippets = await readSnippetFile(item.path, true);
	if (snippets === undefined) {
		return;
	}
	Object.values(snippets).forEach((obj) => (obj.scope = scope));
	await writeSnippetFile(fp, snippets, 'Copied extension snippets for safe editing.');
}

/**
 * Handler for extension.modify
 */
async function extractAndModify(item: TreePathItem, context: vscode.ExtensionContext) {
	const langs = await getExtensionSnippetLangs(item.path);
	const savePath = await chooseSnippetFile(langs);
	if (savePath === undefined) {
		return;
	}

	const snippetTitle = item.description?.toString() ?? '';
	const { readSnippet } = await import('../../snippets/updateSnippets.js');
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

	const { editSnippet } = await import('../../ui/editor/startEditor.js');
	await editSnippet(context, langId, snippetData, snippetBodyAsString(snippet?.body));
}

/**
 * Given a list of languages, have the user select an existing snipppet file
 */
async function chooseSnippetFile(langs: string[]) {
	let files;
	if (langs.length === 1) {
		files = await locateSnippetFiles(langs[0]);
	} else {
		const [workspaceFiles, profileFiles] = await Promise.all([
			findCodeSnippetsFiles(path.join(getWorkspaceFolder() as string, '.vscode')),
			findCodeSnippetsFiles(path.join(await getActiveProfileSnippetsDir())),
		]);
		files = [...workspaceFiles, ...profileFiles];
	}

	const options: vscode.QuickPickItem[] = files.map((fp) => ({
		label: path.basename(fp),
		description: fp,
	}));
	const selected = await vscode.window.showQuickPick(options, {
		title: 'Pick a file to save this snippet to after editing',
	});
	return selected?.description;
}

export { extractAllSnippets, extractAndModify };
