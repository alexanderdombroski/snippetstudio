// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import {
	showErrorMessage,
	createQuickPick,
	showWarningMessage,
	showQuickPick,
	showInformationMessage,
	getLanguages,
} from '../vscode';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage, selectLanguage } from '../utils/language';
import { locateAllSnippetFiles } from './locateSnippets';
import type { VSCodeSnippets } from '../types';
import { readJsoncFilesAsync, writeSnippetFile } from '../utils/jsoncFilesIO';
import { getActiveProfileSnippetsDir } from '../utils/profile';
import { getFileName, getSavePath } from '../utils/user';
import {
	getLinkedSnippets,
	getLinkLocations,
	isSnippetLinked,
	updateAllSettings,
} from './links/config';

/** Creates an empty JSON file with {} and returns string alertStatus */
export async function createFile(
	filepath: string,
	showInfoMessage: boolean = true,
	notSnippetFile?: boolean
): Promise<'skipped' | undefined> {
	if (await exists(filepath)) {
		showInfoMessage && showInformationMessage('File already exists! ' + path.basename(filepath));
	} else if (!notSnippetFile && (await isSnippetLinked(filepath, true))) {
		showWarningMessage(
			'Skipped File Creation. A linked snippet file of a matching filename exists already in some profile.'
		);
		return 'skipped';
	} else {
		// File doesn't exist and should, create it
		await fs.mkdir(path.dirname(filepath), { recursive: true }); // Ensure directory exists
		await fs.writeFile(filepath, '{}'); // Create an empty JSON file
	}
}

/** prompts filename and creates empty snippets file in .vscode project folder */
export async function createLocalSnippetsFile(): Promise<void> {
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

/** creates a language snippet file if doesn't exists */
export async function createGlobalLangFile(): Promise<void> {
	const langId = getCurrentLanguage() ?? (await selectLanguage());
	if (langId === undefined) {
		showErrorMessage('No recently used language.');
		return;
	}
	const dir = await getActiveProfileSnippetsDir();
	const filepath = path.join(dir, `${langId}.json`);
	await createFile(filepath);
}

/** creates a .code-snippets file in the user snippets folder */
export async function createGlobalSnippetsFile(): Promise<void> {
	const dir = await getActiveProfileSnippetsDir();
	const name = await getFileName();
	if (name === undefined) {
		return;
	}

	const filepath = path.join(dir, `${name}.code-snippets`);
	await createFile(filepath);
}

/** creates a .code-snippets file with chosen snippets from chosen files */
export async function exportSnippets() {
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

/** Lets the user pick snippets from each file and merges them into one object */
export async function mergeSnippetFiles(): Promise<VSCodeSnippets | undefined> {
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
		const quickPick = createQuickPick();
		quickPick.canSelectMany = true;
		quickPick.title = 'Pick Snippets to export';
		quickPick.items = items;
		quickPick.show();

		const snippetKeys: string[] | undefined = await new Promise((resolve) => {
			let resolved = false;

			quickPick.onDidAccept(() => {
				const selectedItems = quickPick.selectedItems.map((item) => item.label);
				resolved = true;
				quickPick.hide();
				resolve(selectedItems);
			});

			quickPick.onDidHide(() => {
				if (!resolved) {
					resolve(undefined);
				}
			});
		});

		quickPick.dispose();

		const langIds = await getLanguages();

		// Add Snippets to export object
		if (snippetKeys !== undefined) {
			const langId = path.basename(filepath, path.extname(filepath));
			snippetKeys.forEach((key) => {
				if (key in snippetsToExport) {
					showWarningMessage(`Two Snippets hold the same titleKey: ${key}. Only one will be used`);
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

/** Uses a quickpick to allow the user select one or more snippet paths */
async function chooseSnippetFiles(): Promise<string[] | undefined> {
	const [actives, locals, profiles] = await locateAllSnippetFiles();
	const profileFiles = Object.values(profiles)
		.map((files) => files)
		.flat();
	const snippetFiles = [...actives, ...locals, ...profileFiles];
	if (snippetFiles.length === 0) {
		showWarningMessage('You have no snippets to export. Operation cancelled');
		return;
	}

	// Select Snippets Files
	const fileItems = await showQuickPick(
		snippetFiles.map((fp) => ({ label: path.basename(fp), description: fp })),
		{ canPickMany: true, title: 'Choose Snippet Files to include in the Export' }
	);
	if (fileItems === undefined) {
		return;
	}
	return fileItems.map((item) => item.description);
}

/** Renames a snippet file */
export async function renameSnippetFile(fp: string) {
	const oldFile = path.basename(fp);
	const newName = await getFileName(`Type a new name for ${oldFile} file.`);
	if (!newName) {
		return;
	}

	const newFile = newName + '.code-snippets';
	const isLinked = await isSnippetLinked(fp);

	const filesToCheck: string[] = [];
	let links;
	if (isLinked) {
		links = await getLinkedSnippets();
		if (Object.hasOwn(links, newFile)) {
			showWarningMessage(
				`Cannot rename file because ${newFile} is already linked in some other profile`
			);
			return;
		}
		filesToCheck.push(...(await getLinkLocations(fp)).map((dir) => path.join(dir, newFile)));
	} else {
		filesToCheck.push(path.join(path.dirname(fp), newFile));
	}

	const pathAlreadyUsed = (await Promise.all(filesToCheck.map((p) => exists(p)))).some(Boolean);
	if (pathAlreadyUsed) {
		showWarningMessage('A snippet file of that name already exists and would be overwritten');
		return;
	}

	const task = async (newPath: string) => {
		const oldPath = path.join(path.dirname(newPath), oldFile);
		await fs.rename(oldPath, newPath);
	};
	await Promise.all(filesToCheck.map((fp) => task(fp)));

	if (isLinked && links) {
		links[newFile] = links[oldFile];
		delete links[oldFile];
		await updateAllSettings(links);
	}

	showInformationMessage(`Successfully renamed ${filesToCheck.length} files`);
}
