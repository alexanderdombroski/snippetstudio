import * as fs from 'fs/promises';
import path from 'path';
import * as vscode from 'vscode';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage, langIds, selectLanguage } from '../utils/language';
import { locateAllSnippetFiles } from './locateSnippets';
import type { VSCodeSnippets } from '../types';
import { readJsoncFilesAsync, writeSnippetFile } from '../utils/jsoncFilesIO';
import { getActiveProfileSnippetsDir } from '../utils/profile';
import { getFileName, getSavePath } from '../utils/user';
import { isSnippetLinked } from './links';

/**
 * Creates an empty JSON file with {} and returns string alertStatus
 */
async function createFile(
	filepath: string,
	showInformationMessage: boolean = true,
	notSnippetFile?: boolean
): Promise<'skipped' | undefined> {
	if ((await exists(filepath)) && showInformationMessage) {
		vscode.window.showInformationMessage('File already exists! ' + path.basename(filepath));
	} else if (!notSnippetFile && (await isSnippetLinked(filepath, true))) {
		vscode.window.showWarningMessage(
			'Skipped File Creation. A linked snippet file of a matching filename exists already in some profile.'
		);
		return 'skipped';
	} else {
		// File doesn't exist and should, create it
		await fs.mkdir(path.dirname(filepath), { recursive: true }); // Ensure directory exists
		await fs.writeFile(filepath, '{}'); // Create an empty JSON file
	}
}

async function createLocalSnippetsFile(): Promise<void> {
	const cwd = getWorkspaceFolder();
	if (!cwd) {
		return;
	}
	const name = await getFileName();
	if (name === undefined) {
		return;
	}

	const filepath = path.join(cwd, '.vscode', `${name}.code-snippets`);
	await createFile(filepath);
}

async function createGlobalLangFile(): Promise<void> {
	const langId = getCurrentLanguage() ?? (await selectLanguage());
	if (langId === undefined) {
		vscode.window.showErrorMessage('No recently used language.');
		return;
	}
	const dir = await getActiveProfileSnippetsDir();
	const filepath = path.join(dir, `${langId}.json`);
	await createFile(filepath);
}

async function createGlobalSnippetsFile(): Promise<void> {
	const dir = await getActiveProfileSnippetsDir();
	const name = await getFileName();
	if (name === undefined) {
		return;
	}

	const filepath = path.join(dir, `${name}.code-snippets`);
	await createFile(filepath);
}

async function exportSnippets() {
	// Select Save Paths
	const savePath = await getSavePath();
	if (savePath === undefined) {
		return;
	}

	const snippetsToExport = await mergeSnippetFiles();
	if (snippetsToExport === undefined) {
		return;
	}

	// Select Snippets
	await writeSnippetFile(savePath, snippetsToExport, `Snippets exported to ${savePath}`);
}

/**
 * Lets the user pick snippets from each file and merges them into one object
 */
async function mergeSnippetFiles(): Promise<VSCodeSnippets | undefined> {
	const filepaths = await chooseSnippetFiles();
	if (filepaths === undefined) {
		return;
	}

	let snippetsToExport: VSCodeSnippets = {};
	const snippetGroups: [string, VSCodeSnippets][] = await readJsoncFilesAsync(filepaths);
	for (const [filepath, fileSnippets] of snippetGroups) {
		const items = Object.entries(fileSnippets).map(([k, v]) => {
			const desc = Array.isArray(v.prefix) ? v.prefix.join(', ') : v.prefix;
			return { label: k, description: desc, picked: true };
		});

		if (items.length === 0) {
			continue;
		}

		// Select Snippets
		const quickPick = vscode.window.createQuickPick();
		quickPick.canSelectMany = true;
		quickPick.title = 'Pick Snippets to export';
		quickPick.items = items;
		quickPick.show();

		const snippetKeys: string[] | undefined = await new Promise((resolve) => {
			quickPick.onDidAccept(() => {
				const selectedItems = quickPick.selectedItems.map((item) => item.label);
				quickPick.hide();
				resolve(selectedItems);
			});
			quickPick.onDidHide(() => {
				resolve(undefined);
			});
		});

		// Add Snippets to export object
		if (snippetKeys !== undefined) {
			const langId = path.basename(filepath, path.extname(filepath));
			snippetKeys.forEach((key) => {
				if (key in snippetsToExport) {
					vscode.window.showWarningMessage(
						`Two Snippets hold the same titleKey: ${key}. Only one will be used`
					);
				}
				const obj = fileSnippets[key];

				if (
					obj.scope === undefined &&
					path.extname(filepath) === '.json' &&
					langIds.includes(langId)
				) {
					obj.scope = langId;
				}
				snippetsToExport[key] = obj;
			});
		}
	}

	return snippetsToExport;
}

/**
 * Uses a quickpick to allow the user select one or more snippet paths
 */
async function chooseSnippetFiles(): Promise<string[] | undefined> {
	const [actives, locals, profiles] = await locateAllSnippetFiles();
	const profileFiles = Object.values(profiles)
		.map((files) => files)
		.flat();
	const snippetFiles = [...actives, ...locals, ...profileFiles];
	if (snippetFiles.length === 0) {
		vscode.window.showWarningMessage('You have no snippets to export. Operation cancelled');
		return;
	}

	// Select Snippets Files
	const fileItems = await vscode.window.showQuickPick(
		snippetFiles.map((fp) => ({ label: path.basename(fp), description: fp })),
		{ canPickMany: true, title: 'Choose Snippet Files to include in the Export' }
	);
	if (fileItems === undefined) {
		return;
	}
	return fileItems.map((item) => item.description);
}

export {
	createGlobalLangFile,
	createLocalSnippetsFile,
	createGlobalSnippetsFile,
	createFile,
	exportSnippets,
	mergeSnippetFiles,
};
