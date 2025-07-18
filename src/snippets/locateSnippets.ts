import * as path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { getGlobalSnippetFilesDir, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage, langIds } from '../utils/language';

// ---------------------------- Language Specfic ---------------------------- //

/**
 * Finds all snippet files for a given language ID, starting from the workspace root and including global snippets.
 * Returns an empty array if there is no open editor and workspace folder.
 *
 * @returns A promise that resolves to an array of file paths.
 */
async function locateSnippetFiles(): Promise<string[]> {
	const filePaths: string[] = [];

	// Global
	const langId = getCurrentLanguage();
	const global = await getGlobalSnippetFiles(langId);
	filePaths.push(...global);

	// Local
	const folder = getWorkspaceFolder();
	if (folder) {
		const workspaceSnippets = await findCodeSnippetsFiles(path.join(folder, '.vscode'));
		filePaths.push(...workspaceSnippets);
	}

	return filePaths;
}

/**
 * Searches and finds the global snippets file for a given language.
 *
 * @param langId
 * @returns returns a global snippet filepath, or empty string if couldn't find it.
 */
async function getGlobalSnippetFiles(langId: string | undefined): Promise<string[]> {
	const paths: string[] = [];
	const globalSnippetsPath = getGlobalSnippetFilesDir();
	if (!globalSnippetsPath) {
		return [];
	}

	const languageSnippetFilePath = path.join(globalSnippetsPath, `${langId}.json`);
	const disabledLanguageSnippetFilePath = path.join(
		globalSnippetsPath,
		`${langId}.json.disabled`
	);
	if (langId) {
		fs.existsSync(languageSnippetFilePath) && paths.push(languageSnippetFilePath);
		fs.existsSync(disabledLanguageSnippetFilePath) &&
			paths.push(disabledLanguageSnippetFilePath);
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
async function findCodeSnippetsFiles(folderPath: string): Promise<string[]> {
	const [snippets, disabledSnippets] = await Promise.all([
		glob(path.join(folderPath, '*.code-snippets')),
		glob(path.join(folderPath, '*.code-snippets.disabled')),
	]);
	return [...snippets, ...disabledSnippets];
}

/**
 * Returns a tuple of local and global snippets of any language. [ LOCAL, GLOBAL ]
 *
 * @param folderPath The path to the workspace folder.
 * @param filePaths The array to store the found file paths.
 */
async function locateAllSnippetFiles(): Promise<[string[], string[]]> {
	let locals: string[] = [];
	let globals: string[] = [];

	const cwd = getWorkspaceFolder();
	if (cwd !== undefined) {
		locals = await findCodeSnippetsFiles(path.join(cwd, '.vscode'));
	}

	const globalDir = getGlobalSnippetFilesDir();
	globals = await findAllGlobalSnippetFiles(globalDir);

	return [locals, globals];
}

/**
 * Finds all global snippet files.
 */
async function findAllGlobalSnippetFiles(globalDir: string | undefined): Promise<string[]> {
	const snippetFiles: string[] = [];

	if (globalDir !== undefined) {
		for (var langId of langIds) {
			const snippetFile = path.join(globalDir, `${langId}.json`);
			const disabledSnippetFile = path.join(globalDir, `${langId}.json.disabled`);
			fs.existsSync(snippetFile) && snippetFiles.push(snippetFile);
			fs.existsSync(disabledSnippetFile) && snippetFiles.push(disabledSnippetFile);
		}

		const files = await findCodeSnippetsFiles(globalDir);
		snippetFiles.push(...files);
	}

	return snippetFiles;
}

export { locateSnippetFiles, locateAllSnippetFiles, findAllGlobalSnippetFiles };
