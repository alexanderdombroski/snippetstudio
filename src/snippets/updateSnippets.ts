// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import {
	executeCommand,
	showQuickPick,
	showInformationMessage,
	showErrorMessage,
	showWarningMessage,
} from '../vscode';
import type { VSCodeSnippet } from '../types';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import path from 'node:path';
import fs from 'fs/promises';
import { getCurrentLanguage } from '../utils/language';
import { locateAllSnippetFiles } from './locateSnippets';
import type { TreePathItem } from '../ui/templates';
import { exists } from '../utils/fsInfo';
import { isSnippetLinked } from './links/config';

// -------------------------- CRUD operations --------------------------

async function writeSnippet(filepath: string, titleKey: string, snippet: VSCodeSnippet) {
	const snippets = await readSnippetFile(filepath);
	if (snippets === undefined) {
		showWarningMessage(
			`Read Operation failed. Write operation of ${titleKey} to ${path.basename(filepath)} canceled.`
		);
		return;
	}

	if (snippet.scope) {
		if (path.extname(filepath) === '.json') {
			delete snippet.scope;
		}
	} else if (path.extname(filepath) === '.code-snippets') {
		snippet.scope = getCurrentLanguage() ?? 'plaintext';
	}

	snippets[titleKey] = snippet;
	await writeSnippetFile(filepath, snippets);
}

async function deleteSnippet(filepath: string, titleKey: string) {
	const snippets = await readSnippetFile(filepath);
	if (snippets === undefined) {
		return;
	}

	if (snippets.hasOwnProperty(titleKey)) {
		delete snippets[titleKey];
		await writeSnippetFile(filepath, snippets);
	}
}

/**
 * Return a snippet from a snippet file. Use tryFlatten if the file is from an extension.
 */
async function readSnippet(
	filepath: string,
	snippetTitle: string,
	tryFlatten?: boolean
): Promise<VSCodeSnippet | undefined> {
	const snippets = await readSnippetFile(filepath, tryFlatten);
	if (snippets === undefined || snippets[snippetTitle] === undefined) {
		console.error(
			`Read Operation failed. Could not find ${snippetTitle} inside of ${path.basename(filepath)}.`
		);
		return;
	}

	return snippets[snippetTitle];
}

/**
 * Handler for the snippet.move command
 */
async function moveSnippet(item: TreePathItem) {
	const [actives, locals, profiles] = await locateAllSnippetFiles();
	const profileFiles = Object.values(profiles)
		.map((files) => files)
		.flat();
	const files = [...actives, ...locals, ...profileFiles];
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

	const { readSnippet, writeSnippet } = await import('../snippets/updateSnippets.js');
	const snippet = (await readSnippet(item.path, item.description as string)) as VSCodeSnippet;

	await Promise.all([
		writeSnippet(selected.description, item.description as string, snippet),
		executeCommand('snippetstudio.snippet.delete', item),
	]);
}

async function deleteSnippetFile(filepath: string) {
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
		showInformationMessage(`Snippet file deleted: ${filename}\n${filepath}`);
	} catch (error) {
		if (error instanceof Error) {
			showErrorMessage(`Error deleting file: ${error.message}`);
		} else {
			showErrorMessage(`An unknown error occurred: ${error}`);
		}
	}
}

export { deleteSnippet, writeSnippet, readSnippet, moveSnippet, deleteSnippetFile };
