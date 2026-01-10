// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import { showOpenDialog, showInformationMessage, showQuickPick, showInputBox } from '../vscode';
import fs from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { processJsonWithComments } from '../utils/jsoncFilesIO';
import type { VSCodeSnippets } from '../types';
import { chooseLocalGlobal } from '../utils/user';
import { exists } from '../utils/fsInfo';

/** command handler to import all snippets from a .code-profile file at a chosen location */
export async function importCodeProfileSnippets() {
	const items = [
		{
			label: 'From profile template',
			description: 'snippets typically created from a vscode profile template',
			run: _fromBuiltIn,
		},
		{
			label: 'From a gist',
			description: 'import snippets from a .code-profile file from a gist',
			run: () => _fromGist(),
		},
		{
			label: 'From a file',
			description: 'choose a .code-profile file in your file manager',
			run: _fromFile,
		},
		{
			label: 'From a url',
			description: 'fetch the .code-profile file raw from a url',
			run: _fromUrl,
		},
	];
	const selection = await showQuickPick(items, {
		title: 'Select a source to get snippets from a built in code profile.',
	});
	if (selection === undefined) {
		return;
	}

	const fileContents = await selection.run();
	if (fileContents === undefined) {
		return;
	}

	const saveDir = await chooseLocalGlobal();
	if (saveDir === undefined) {
		return;
	}

	Promise.all(fileContents.map(async (content) => saveCodeProfiles(content, saveDir)));
}

// ------------------------------ Parse Code Profile File ------------------------------

/** exports all snippets from a profile to a given directory */
async function saveCodeProfiles(
	profileFileContent: string,
	saveDir: string
): Promise<VSCodeSnippets | undefined> {
	const firstParse: { snippets?: string } = await processJsonWithComments(profileFileContent);
	if (!firstParse.snippets) {
		showInformationMessage("Target code profile file didn't have snippets");
		return;
	}
	const secondParse: { snippets: { [filename: string]: string } } = await processJsonWithComments(
		firstParse.snippets
	);

	const tasks = Object.entries(secondParse.snippets).map(async ([name, fileContent]) => {
		const idealPath = path.join(saveDir, name);
		const savePath = (await exists(idealPath))
			? path.join(saveDir, crypto.randomUUID() + '.code-snippets')
			: idealPath;
		if (name.endsWith('.json')) {
			const parsed: VSCodeSnippets = await processJsonWithComments(fileContent);
			const lang = path.basename(name, '.json');
			Object.values(parsed).forEach((snippet) => (snippet.scope = lang));
			fileContent = JSON.stringify(parsed, null, 2);
		}
		await fs.writeFile(savePath, fileContent, 'utf-8');
	});

	await Promise.all(tasks);
}

// ------------------------------ Get Code Profile File Content ------------------------------

/** pick a .code-profile file via file expolorer and  */
async function _fromFile(): Promise<string[] | undefined> {
	const uris = await showOpenDialog({
		canSelectFiles: true,
		canSelectFolders: false,
		canSelectMany: true,
		filters: {
			'Code Snippets': ['code-profile'],
			'All Files': ['*'],
		},
		openLabel: 'Select code-profile file(s)',
	});

	if (!uris?.length) {
		return;
	}

	const contents = await Promise.all(
		uris.map(async (uri) => {
			const bytes = await fs.readFile(uri.fsPath);
			return bytes.toString('utf8');
		})
	);

	return contents;
}

/** attempts to reads a .code-profile from a gist */
export async function _fromGist(): Promise<string[] | undefined> {
	const { getGistId } = await import('../git/utils.js');
	const gistId = await getGistId();
	if (gistId === undefined) {
		return;
	}

	const { getOctokitClient } = await import('../git/octokit.js');
	const client = await getOctokitClient();

	const response = await client.request('GET /gists/{gist_id}', { gist_id: gistId });
	const files = Object.values(response.data.files ?? {}).filter(
		(file) => file && path.extname(file.filename ?? '') === '.code-profile'
	) as { content: string; filename: string; type: string }[];

	if (files.length === 0) {
		showInformationMessage("Couldn't find any .code-profiles files in this gist.");
		return;
	}

	return files.map((file) => file.content as string);
}

/** gets the snippets from Microsoft's template code profiles */
export async function _fromBuiltIn(): Promise<string[] | undefined> {
	const validProfiles = [
		'python',
		// 'angular',
		// 'doc-writer',
		'data-science',
		// 'java-general',
		'java-spring',
		// 'nodejs',
	];

	const selected = await showQuickPick(
		validProfiles.map((template) => ({ label: template })),
		{ title: 'Choose a code profile template' }
	);
	if (selected === undefined) {
		return;
	}

	const url = `https://main.vscode-cdn.net/core/${selected.label}.code-profile`;

	return [await fetchProfile(url)];
}

/** gets file from user  code profile from a url with the raw file */
export async function _fromUrl(): Promise<string[] | undefined> {
	const url = await showInputBox({
		title: 'Paste a URL to a raw .code-snippets file',
	});
	if (url) {
		return [await fetchProfile(url)];
	}
}

/** reads code profile from a url with the raw file */
async function fetchProfile(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode !== 200) {
					reject(new Error(`Failed to get ${url}, status: ${res.statusCode}`));
					res.resume();
					return;
				}
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => resolve(data));
			})
			.on('error', reject);
	});
}
