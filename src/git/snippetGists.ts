import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import getOctokitClient from './octokit';
import { getFileName, mergeSnippetFiles } from '../snippets/newSnippetFile';
import { chooseLocalGlobal, getSavePathFromDialog } from '../utils/user';

async function createGist(context: vscode.ExtensionContext) {
	const client = await getOctokitClient(context);

	const filename = (await getFileName()) + '.code-snippets';
	if (filename === undefined) {
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

	vscode.window.showInformationMessage(`${filename} saved in ${response.data.html_url}.`);
}

async function importGist(context: vscode.ExtensionContext) {
	const identifier = await vscode.window.showInputBox({
		title: 'Input a gist id, share url, or clone url',
	});
	if (identifier === undefined) {
		return;
	}

	const gistId = extractGistId(identifier.trim());

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

function extractGistId(identifier: string): string {
	// From share URL
	const shareUrlRegex = /https:\/\/gist\.github\.com\/[\w-]+\/([a-f0-9]+)/i;
	let match = identifier.match(shareUrlRegex);
	if (match) {
		return match[1];
	}

	// From Clone URL
	const cloneUrlRegex = /https:\/\/gist\.github\.com\/([a-f0-9]+)\.git/i;
	match = identifier.match(cloneUrlRegex);
	if (match) {
		return match[1];
	}

	// From SSH URL
	const sshUrlRegex = /git@gist\.github\.com:([a-f0-9]+)\.git/i;
	match = identifier.match(sshUrlRegex);
	if (match) {
		return match[1];
	}

	// (Gist ID itself)
	const gistIdRegex = /^[a-f0-9]+$/i;
	if (gistIdRegex.test(identifier)) {
		return identifier;
	}

	const error = new Error(`Invalid Gist identifier: ${identifier}`);
	vscode.window.showErrorMessage(error.message);
	throw error;
}

export { createGist, importGist };
