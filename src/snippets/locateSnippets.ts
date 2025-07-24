import * as path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage, langIds } from '../utils/language';
import {
	getActiveProfileSnippetsDir,
	getPathFromProfile,
	getAllGlobalSnippetDirs,
	getProfiles,
	getActiveProfile,
} from '../utils/profile';
import type { ProfileSnippetsMap } from '../types';

// ---------------------------- Language Specfic ---------------------------- //

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets.
 * Returns an empty array if there is no open editor and workspace folder.
 *
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(langId?: string): Promise<string[]> {
	langId ??= getCurrentLanguage();
	const globalDirs = await getAllGlobalSnippetDirs();

	const globalTasks = globalDirs.map((dir) => {
		return getGlobalLangSnippetFiles(dir, langId);
	});

	const localTask = (async () => {
		const folder = getWorkspaceFolder();
		if (folder) {
			return findCodeSnippetsFiles(path.join(folder, '.vscode'));
		}
		return [];
	})();

	return (await Promise.all([...globalTasks, localTask])).flat();
}

/**
 * Searches and finds the global snippets file for a given language.
 *
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
async function getGlobalLangSnippetFiles(
	globalSnippetsPath: string,
	langId?: string
): Promise<string[]> {
	const paths: string[] = [];

	const languageSnippetFilePath = path.join(globalSnippetsPath, `${langId}.json`);
	if (langId && fs.existsSync(languageSnippetFilePath)) {
		paths.push(languageSnippetFilePath);
	}

	const globalMixedSnippetsPaths = await findCodeSnippetsFiles(globalSnippetsPath);
	paths.push(...globalMixedSnippetsPaths);

	return paths;
}

// ---------------------------- Any Language ---------------------------- //

/**
 * Finds the code-snippets files in a workspace folder.
 *
 * @param folderPath The path to the workspace folder.
 */
export async function findCodeSnippetsFiles(folderPath: string): Promise<string[]> {
	return await glob(path.join(folderPath, '*.code-snippets'));
}

/**
 * Returns a tuple of local and global snippets of any language. [ LOCAL, GLOBAL ]
 *
 * @param folderPath The path to the workspace folder.
 * @param filePaths The array to store the found file paths.
 */
async function locateAllSnippetFiles(): Promise<[string[], string[], ProfileSnippetsMap]> {
	const getLocals = async (): Promise<string[]> => {
		const cwd = getWorkspaceFolder();
		return cwd ? await findCodeSnippetsFiles(path.join(cwd, '.vscode')) : [];
	};

	const getGlobals = async (): Promise<string[]> => {
		const globalDir = await getActiveProfileSnippetsDir();
		return await findAllGlobalSnippetFiles(globalDir);
	};

	const active = await getActiveProfile();

	const getProfileSnippetsMap = async (): Promise<ProfileSnippetsMap> => {
		const profiles = await getProfiles();
		const tasks = profiles
			.filter((p) => p.location !== active.location)
			.map(async (p): Promise<[string, string[]]> => {
				const path = getPathFromProfile(p);
				return [p.location, await findAllGlobalSnippetFiles(path)];
			});
		const paths: [string, string[]][] = await Promise.all(tasks);
		return Object.fromEntries(paths);
	};

	const [locals, globals, profileSnippetsMap] = await Promise.all([
		getLocals(),
		getGlobals(),
		getProfileSnippetsMap(),
	]);

	profileSnippetsMap[active.location] = globals;

	return [locals, globals, profileSnippetsMap];
}

/**
 * Finds all global snippet files.
 */
async function findAllGlobalSnippetFiles(globalDir: string): Promise<string[]> {
	const snippetFiles: string[] = [];

	for (var langId of langIds) {
		const snippetFile = path.join(globalDir, `${langId}.json`);
		fs.existsSync(snippetFile) && snippetFiles.push(snippetFile);
	}

	const files = await findCodeSnippetsFiles(globalDir);
	snippetFiles.push(...files);

	return snippetFiles;
}

export { locateSnippetFiles, locateAllSnippetFiles, findAllGlobalSnippetFiles };
