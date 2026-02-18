// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import {
	showQuickPick,
	showInformationMessage,
	showErrorMessage,
	showWarningMessage,
	getConfiguration,
} from '../vscode';
import type { VSCodeSnippet } from '../types';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import path from 'node:path';
import fs from 'fs/promises';
import { getCurrentLanguage } from '../utils/language';
import { getAllSnippetFilesList } from './locateSnippets';
import type { SnippetTreeItem } from '../ui/templates';
import { exists } from '../utils/fsInfo';
import { isSnippetLinked } from './links/config';
import { getCacheManager } from './SnippetCacheManager';
import { getConfirmation } from '../utils/user';

// -------------------------- CRUD operations --------------------------

/**
 * adds a snippet to a snippet file. Overwrites entries of the same titleKey
 * @returns true if it is successful
 */
export async function writeSnippet(
	filepath: string,
	titleKey: string,
	snippet: VSCodeSnippet
): Promise<boolean | undefined> {
	const snippets = await readSnippetFile(filepath, { showError: true });
	if (snippets === undefined) {
		showWarningMessage(
			`Read Operation failed. Write operation of ${titleKey} to ${path.basename(filepath)} canceled.`
		);
		return;
	}

	if (path.extname(filepath) === '.json' || snippet.scope === 'global') {
		delete snippet.scope;
	} else if (!snippet.scope) {
		snippet.scope = getCurrentLanguage() ?? 'plaintext';
	}

	snippets[titleKey] = snippet;
	await writeSnippetFile(filepath, snippets);
	return true;
}

/** removes a single snippet from a snippet file */
export async function deleteSnippet(filepath: string, titleKey: string) {
	const snippets = await getCacheManager().getSnippets(filepath, { showError: true });
	if (!snippets) {
		return;
	}

	if (
		getConfiguration('snippetstudio').get<boolean>('confirmSnippetDeletion') &&
		!(await getConfirmation(`Are you sure you want to delete "${titleKey}"?`))
	) {
		return;
	}

	if (snippets.hasOwnProperty(titleKey)) {
		delete snippets[titleKey];
		await writeSnippetFile(filepath, snippets);
	}
}

/** Return a snippet from a snippet file. Use tryFlatten if the file is from an extension. */
export async function readSnippet(
	filepath: string,
	snippetTitle: string,
	isExtensionSnippet?: boolean
): Promise<VSCodeSnippet | undefined> {
	const snippets = await getCacheManager().getSnippets(filepath, {
		isExtensionSnippet,
		showError: true,
	});
	if (!snippets?.[snippetTitle]) {
		console.error(
			`Read Operation failed. Could not find ${snippetTitle} inside of ${path.basename(filepath)}.`
		);
		return;
	}

	return snippets[snippetTitle];
}

/** Handler for the snippet.move command */
export async function moveSnippet(item: SnippetTreeItem) {
	const files = await getAllSnippetFilesList();
	const options = files
		.filter((file) => file !== item.path)
		.map((file) => ({
			label: path.basename(file),
			description: file,
		}));
	const selected = await showQuickPick(options, {
		title: 'Pick a snippet file to move the snippet to',
	});
	if (selected === undefined) {
		return;
	}

	await moveSnippetToDestination(item.description, item.path, selected.description);
}

/** Logic to move a snippet to another file */
export async function moveSnippetToDestination(
	snippetId: string,
	startPath: string,
	endPath: string
) {
	const cache = getCacheManager();
	const destinationSnippets = await cache.getSnippets(endPath);
	if (!destinationSnippets) return;
	if (Object.hasOwn(destinationSnippets, snippetId)) {
		showWarningMessage('Snippet file already has a snippet of this id');
		return;
	}

	const snippet = (await readSnippet(startPath, snippetId)) as VSCodeSnippet;
	if (path.extname(startPath) === '.code-snippets' && !snippet.scope) {
		snippet.scope = 'global';
	}

	const success = await writeSnippet(endPath, snippetId, snippet);
	if (success) {
		await deleteSnippet(startPath, snippetId);
	}
}

/** deletes snippet file on user confirmation if not linked and exists */
export async function deleteSnippetFile(filepath: string) {
	if (await isSnippetLinked(filepath)) {
		showWarningMessage("Don't delete a linked snippet file until you unlink it first!");
		return;
	}
	const filename = path.basename(filepath);

	if (!(await exists(filepath))) {
		showErrorMessage(`${filename} File doesn't exits: ${filepath}`);
		return;
	}

	// Confirmation message
	const confirmation = await showInformationMessage(
		`Are you sure you want to delete "${filename}"?`,
		{ modal: true },
		'Yes',
		'No'
	);
	if (confirmation !== 'Yes') {
		return;
	}

	try {
		await fs.unlink(filepath);
		getCacheManager().remove(filepath);
		showInformationMessage(`Snippet file deleted: ${filename}\n${filepath}`);
	} catch (error) {
		const msg = (error as Error).message
			? `Error deleting file: ${(error as Error).message}`
			: `An unknown error occurred: ${error}`;
		showErrorMessage(msg);
	}
}
