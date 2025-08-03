import fs from 'node:fs/promises';
import type { VSCodeSnippets } from '../types';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';
import { isDeepStrictEqual } from 'node:util';

/**
 * Merge two json files (the mergePath into KeepPath).
 * Don't overwrite duplicate keys, instead change the keynames of mergeFiles that are duplicates
 */
async function mergeFiles(globalPath: string, mergePath: string) {
	const [baseSnippets, mergeSnippets] = await Promise.all([
		readSnippetFile(globalPath),
		readSnippetFile(mergePath),
	]);

	if (!mergeSnippets) {
		// Delete mergePath if has no snippets
		await fs.unlink(mergePath);
		return;
	}

	if (!baseSnippets) {
		// Move all if no base snippets
		await fs.rename(mergePath, globalPath);
		return;
	}

	Object.keys(mergeSnippets).forEach((key) => {
		const incoming = mergeSnippets[key];
		const existing = baseSnippets[key];

		if (existing) {
			if (!isDeepStrictEqual(existing, incoming)) {
				const newName = getNewPropName(key, baseSnippets);
				baseSnippets[newName] = incoming;
			}
		} else {
			baseSnippets[key] = incoming;
		}
	});

	await writeSnippetFile(globalPath, baseSnippets, '', true);
	await fs.unlink(mergePath);
}

/**
 * Given a key of the snippetsObj, append the lowest number
 * possible to the string until finding a key that doens't exist in the object
 */
function getNewPropName(oldName: string, snippetsObj: VSCodeSnippets): string {
	if (!snippetsObj[oldName]) {
		return oldName;
	}

	let i = 1;
	while (true) {
		const newName = `${oldName}${i}`;
		if (!snippetsObj[newName]) {
			return newName;
		}
		i++;
	}
}
