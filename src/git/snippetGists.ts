import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { getOctokitClient } from './octokit';
import { mergeSnippetFiles } from '../snippets/newSnippetFile';
import { chooseLocalGlobal, getFileName, getSavePathFromDialog } from '../utils/user';
import { getGistId } from './utils';

async function createGist(context: vscode.ExtensionContext) {
	const client = await getOctokitClient(context);

	const filename = (await getFileName()) + '.code-snippets';
	if (filename === 'undefined.code-snippets') {
		return;
	}

	const snippetsToExport = await mergeSnippetFiles();
	if (snippetsToExport === undefined) {
		return;
	}

	const fileContent = JSON.stringify(snippetsToExport, null, 2);

	let desc = await vscode.window.showInputBox({ prompt: 'Optional: Type a desc' });
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
	vscode.window
		.showInformationMessage(`Successfully created gist '${filename}'`, openInBrowser)
		.then((selection) => {
			if (selection === openInBrowser && response.data.html_url) {
				vscode.env.openExternal(vscode.Uri.parse(response.data.html_url));
			}
		});
}

async function importGist(context: vscode.ExtensionContext) {
	const gistId = await getGistId();
	if (gistId === undefined) {
		return;
	}

	const saveDir = await chooseLocalGlobal();
	if (saveDir === undefined) {
		return;
	}

	await saveCodeSnippets(context, gistId, saveDir);
}

async function saveCodeSnippets(
	context: vscode.ExtensionContext,
	gist_id: string,
	saveDir: string
): Promise<void> {
	const client = await getOctokitClient(context);
	const response = await client.request('GET /gists/{gist_id}', { gist_id });
	if (response.data.files === undefined) {
		vscode.window.showInformationMessage("Couldn't find any files in this gist.");
		return;
	}

	let fileCount = 0;
	const includeAll = !vscode.workspace
		.getConfiguration('snippetstudio')
		.get<boolean>('gists.onlySnippets');

	await Promise.all(
		Object.values(response.data.files).map(async (file) => {
			if (
				file &&
				file.filename &&
				file.content &&
				(includeAll || file.filename.endsWith('.code-snippets'))
			) {
				let savePath: string | undefined = path.join(saveDir, file.filename);
				if (fs.existsSync(savePath)) {
					savePath = await getSavePathFromDialog(file.filename, saveDir);
				}

				if (savePath) {
					await fs.promises.writeFile(savePath, file.content);
					fileCount += 1;
				}
			}
		})
	);

	vscode.window.showInformationMessage(`Saved ${fileCount} files in ${saveDir}`);
}

export { createGist, importGist };
