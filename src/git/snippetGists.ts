// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import {
	showInputBox,
	showInformationMessage,
	openExternal,
	Uri,
	getConfiguration,
} from '../vscode';
import path from 'node:path';
import fs from 'node:fs/promises';

import { getOctokitClient } from './octokit';
import { mergeSnippetFiles } from '../snippets/newSnippetFile';
import { chooseLocalGlobal, getFileName, getSavePathFromDialog } from '../utils/user';
import { getGistId } from './utils';
import { exists } from '../utils/fsInfo';

/** creates a new gist from exported snippets */
async function createGist() {
	const client = await getOctokitClient();

	const filename = (await getFileName()) + '.code-snippets';
	if (filename === 'undefined.code-snippets') {
		return;
	}

	const snippetsToExport = await mergeSnippetFiles();
	if (snippetsToExport === undefined) {
		return;
	}

	const fileContent = JSON.stringify(snippetsToExport, null, 2);

	let desc = await showInputBox({ prompt: 'Optional: Type a desc' });
	const msg = 'Created using SnippetStudio';
	desc = desc ? `${desc.trim()} | ${msg}` : msg;

	const response = await client.request('POST /gists', {
		files: {
			[filename]: {
				content: fileContent,
			},
		},
		description: desc,
		public: true,
	});

	const openInBrowser = 'Open Gist';
	showInformationMessage(`Successfully created gist '${filename}'`, openInBrowser).then(
		(selection) => {
			if (selection === openInBrowser && response.data.html_url) {
				openExternal(Uri.parse(response.data.html_url));
			}
		}
	);
}

/** gets a gist id and saves all snippets */
async function importGist() {
	const gistId = await getGistId();
	if (gistId === undefined) {
		return;
	}

	const saveDir = await chooseLocalGlobal();
	if (saveDir === undefined) {
		return;
	}

	await saveCodeSnippets(gistId, saveDir);
}

/** saves all snippets from a gist */
async function saveCodeSnippets(gist_id: string, saveDir: string): Promise<void> {
	const client = await getOctokitClient();
	const response = await client.request('GET /gists/{gist_id}', { gist_id });
	if (response.data.files === undefined) {
		showInformationMessage("Couldn't find any files in this gist.");
		return;
	}

	let fileCount = 0;
	const includeAll = !getConfiguration('snippetstudio').get<boolean>('gists.onlySnippets');

	await Promise.all(
		Object.values(response.data.files).map(async (file) => {
			if (
				file &&
				file.filename &&
				file.content &&
				(includeAll || file.filename.endsWith('.code-snippets'))
			) {
				let savePath: string | undefined = path.join(saveDir, file.filename);
				if (await exists(savePath)) {
					savePath = await getSavePathFromDialog(file.filename, saveDir);
				}

				if (savePath) {
					await fs.writeFile(savePath, file.content);
					fileCount += 1;
				}
			}
		})
	);

	showInformationMessage(`Saved ${fileCount} files in ${saveDir}`);
}

export { createGist, importGist };
