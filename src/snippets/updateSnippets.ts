import type { VSCodeSnippet } from '../types';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import path from 'path';
import { getCurrentLanguage } from '../utils/language';

// -------------------------- CRUD operations --------------------------

async function writeSnippet(filepath: string, titleKey: string, snippet: VSCodeSnippet) {
	const snippets = await readSnippetFile(filepath);
	if (snippets === undefined) {
		console.error(
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

export { deleteSnippet, writeSnippet, readSnippet };
