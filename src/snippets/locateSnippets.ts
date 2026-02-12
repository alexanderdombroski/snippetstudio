import path from 'node:path';
import fs from 'node:fs/promises';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';
import {
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getProfiles,
} from '../utils/profile';
import type { ProfileSnippetsMap } from '../types';
import { getLanguages } from '../vscode';

// ---------------------------- Language Specfic ---------------------------- //

/**
 * Finds all snippet files for a given language ID from the workspace and global snippets.
 * @returns A promise that resolves to an array of file paths.
 */
export async function locateSnippetFiles(langId?: string): Promise<string[]> {
	langId ??= getCurrentLanguage();
	const globalDir = await getActiveProfileSnippetsDir();
	const globalTask = _getGlobalLangSnippetFiles(globalDir, langId);

	const localTask = (async () => {
		const folder = getWorkspaceFolder();
		if (folder) {
			return findCodeSnippetsFiles(path.join(folder, '.vscode'));
		}
		return [];
	})();

	return (await Promise.all([globalTask, localTask])).flat();
}

/**
 * Searches and finds the global snippets file for a given language.
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
export async function _getGlobalLangSnippetFiles(
	globalSnippetsPath: string,
	langId?: string
): Promise<string[]> {
	const paths: string[] = [];

	const languageSnippetFilePath = path.join(globalSnippetsPath, `${langId}.json`);
	if (langId && (await exists(languageSnippetFilePath))) {
		paths.push(languageSnippetFilePath);
	}

	const globalMixedSnippetsPaths = await findCodeSnippetsFiles(globalSnippetsPath);
	paths.push(...globalMixedSnippetsPaths);

	return paths;
}

// ---------------------------- Any Language ---------------------------- //

/**
 * Finds the code-snippets files in a workspace folder.
 * @param folderPath The path to the workspace folder.
 */
export async function findCodeSnippetsFiles(folderPath: string): Promise<string[]> {
	if (await exists(folderPath)) {
		const files = await fs.readdir(folderPath);
		return files.filter((f) => f.endsWith('.code-snippets')).map((f) => path.join(folderPath, f));
	}
	return [];
}

/**
 * Locates snippets reachable by the active profile
 * @returns a tuple of snippets. [ LOCAL, GLOBAL ]
 */
export async function locateActiveSnippetFiles(): Promise<[string[], string[]]> {
	const getLocals = async (): Promise<string[]> => {
		const cwd = getWorkspaceFolder();
		return cwd ? await findCodeSnippetsFiles(path.join(cwd, '.vscode')) : [];
	};

	const getGlobals = async (): Promise<string[]> => {
		const globalDir = await getActiveProfileSnippetsDir();
		return await findAllGlobalSnippetFiles(globalDir);
	};

	return await Promise.all([getLocals(), getGlobals()]);
}

/** Locates all profile snippet files */
export async function locateProfileSnippetFiles(): Promise<ProfileSnippetsMap> {
	const profiles = await getProfiles();
	const tasks = profiles.map(async (p): Promise<[string, string[]]> => {
		const path = getPathFromProfileLocation(p.location);
		return [p.location, await findAllGlobalSnippetFiles(path)];
	});
	const paths: [string, string[]][] = await Promise.all(tasks);
	return Object.fromEntries(paths);
}

/**
 * Locates all user create snippet files
 * @returns [ LOCAL, GLOBAL, PROFILE ]
 */
export async function locateAllSnippetFiles(): Promise<[string[], string[], ProfileSnippetsMap]> {
	const [[local, global], profile] = await Promise.all([
		locateActiveSnippetFiles(),
		locateProfileSnippetFiles(),
	]);
	return [local, global, profile];
}

/** Returns a list of all user created snippet files */
export async function getAllSnippetFilesList(): Promise<string[]> {
	const [actives, locals, profiles] = await locateAllSnippetFiles();
	const profileFiles = Object.values(profiles)
		.map((files) => files)
		.flat();
	const snippetFiles = [...actives, ...locals, ...profileFiles];
	return [...new Set(snippetFiles)];
}

/** Finds all global snippet files. */
async function findAllGlobalSnippetFiles(globalDir: string): Promise<string[]> {
	const snippetFiles: string[] = [];

	const langIds = await getLanguages();
	for (const langId of langIds) {
		const snippetFile = path.join(globalDir, `${langId}.json`);
		(await exists(snippetFile)) && snippetFiles.push(snippetFile);
	}

	const files = await findCodeSnippetsFiles(globalDir);
	snippetFiles.push(...files);

	return snippetFiles;
}
