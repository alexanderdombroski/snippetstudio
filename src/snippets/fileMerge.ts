import path from 'path';
import fs from 'fs';
import { VSCodeSnippets } from '../types/snippetTypes';
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';
import { findAllGlobalSnippetFiles } from './locateSnippets';
import { readSnippetFile, writeSnippetFile } from '../utils/jsoncFilesIO';

/**
 * Merge all snippet files within a the temp folder into the global snippets directory.
 * - If a filename exists in temp but not in globals, just move/copy it
 * - If a filename exists in both, read in the objects and perform a merge. Do not overwrite duplicate keys
 */
export async function mergeGlobals() {
	const baseDir = getGlobalSnippetFilesDir();
	if (baseDir === undefined) {
		return;
	}
	const tempDir = path.join(baseDir, 'temp');
	if (!fs.existsSync(tempDir)) {
		return;
	}

	const [basePaths, mergePaths] = await Promise.all([
		findAllGlobalSnippetFiles(baseDir),
		findAllGlobalSnippetFiles(tempDir),
	]);

	const baseFilenames = new Set(basePaths.map((p) => path.basename(p)));
	const tasks: Promise<void>[] = mergePaths.map((p) => {
		const filename = path.basename(p);
		const globalPath = path.join(baseDir, filename);
		if (baseFilenames.has(filename)) {
			// Add a merge operation
			return mergeFiles(globalPath, p);
		} else {
			// Add a move operation
			return fs.promises.rename(p, globalPath);
		}
	});

	await Promise.all(tasks);

	await fs.promises.rm(tempDir, { recursive: true, force: true });
}

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
		await fs.promises.unlink(mergePath);
		return;
	}

	if (!baseSnippets) {
		// Move all if no base snippets
		await fs.promises.rename(mergePath, globalPath);
		return;
	}

	Object.keys(mergeSnippets).forEach((key) => {
		if (baseSnippets[key]) {
			const newName = getNewPropName(key, baseSnippets);
			baseSnippets[newName] = mergeSnippets[key];
		} else {
			baseSnippets[key] = mergeSnippets[key];
		}
	});

	await writeSnippetFile(globalPath, baseSnippets, '', true);
	await fs.promises.unlink(mergePath);
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
