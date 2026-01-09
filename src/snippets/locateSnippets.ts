import path from 'node:path';
import fs from 'node:fs/promises';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';
import {
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getAllGlobalSnippetDirs,
	getProfiles,
	getActiveProfile,
} from '../utils/profile';
import type { ProfileSnippetsMap } from '../types';
import { getConfiguration, getLanguages } from '../vscode';

// ---------------------------- Language Specfic ---------------------------- //

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets.
 * Returns an empty array if there is no open editor and workspace folder.
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(langId?: string): Promise<string[]> {
	langId ??= getCurrentLanguage();
	const globalDirs = getConfiguration('snippetstudio').get<boolean>('view.showProfiles')
		? await getAllGlobalSnippetDirs()
		: [await getActiveProfileSnippetsDir()];

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
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
async function getGlobalLangSnippetFiles(
	globalSnippetsPath: string,
	langId?: string
): Promise<string[]> {
	const paths: string[] = [];

	const languageSnippetFilePath = path.join(globalSnippetsPath, `${langId}.json`);
	if (langId && (await exists(languageSnippetFilePath))) {
		paths.push(languageSnippetFilePath.split(path.sep).join('/'));
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
		return files
			.filter((f) => f.endsWith('.code-snippets'))
			.map((f) => path.join(folderPath, f).split(path.sep).join('/'));
	}
	return [];
}

/**
 * Locates all snippet files created by the user
 * @returns a tuple of snippets of at various locations. [ LOCAL, GLOBAL, PROFILES ]
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

	const getProfileSnippetsMap = getConfiguration('snippetstudio').get<boolean>('view.showProfiles')
		? async (): Promise<ProfileSnippetsMap> => {
				const profiles = await getProfiles();
				const tasks = profiles
					.filter((p) => p.location !== active.location)
					.map(async (p): Promise<[string, string[]]> => {
						const path = getPathFromProfileLocation(p.location);
						return [p.location, await findAllGlobalSnippetFiles(path)];
					});
				const paths: [string, string[]][] = await Promise.all(tasks);
				return Object.fromEntries(paths);
			}
		: undefined;

	const [locals, globals, profileSnippetsMap] = await Promise.all([
		getLocals(),
		getGlobals(),
		getProfileSnippetsMap?.(),
	]);

	if (profileSnippetsMap) {
		profileSnippetsMap[active.location] = globals;
	}

	return [locals, globals, profileSnippetsMap ?? {}];
}

/** Finds all global snippet files. */
async function findAllGlobalSnippetFiles(globalDir: string): Promise<string[]> {
	const snippetFiles: string[] = [];

	const langIds = await getLanguages();
	for (var langId of langIds) {
		const snippetFile = path.join(globalDir, `${langId}.json`);
		(await exists(snippetFile)) && snippetFiles.push(snippetFile.split(path.sep).join('/'));
	}

	const files = await findCodeSnippetsFiles(globalDir);
	snippetFiles.push(...files);

	return snippetFiles;
}

export { locateSnippetFiles, locateAllSnippetFiles, findAllGlobalSnippetFiles };
