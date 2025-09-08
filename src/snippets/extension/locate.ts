import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { readJson, readJsoncFilesAsync } from '../../utils/jsoncFilesIO';
import type {
	ExtensionSnippetFilesMap,
	ExtensionSnippets,
	ExtensionSnippetsMap,
	JSONObject,
	PackageJsonSnippetsSection,
	SnippetContribution,
	VSCodeSnippet,
	VSCodeSnippets,
} from '../../types';
import { exists } from '../../utils/fsInfo';
import vscode from '../../vscode';

export function __getExtensionsDirPath(): string {
	const appConfigs: Record<string, string> = {
		'Visual Studio Code': '.vscode',
		'Visual Studio Code - Insiders': '.vscode-insiders',
		VSCodium: '.vscode-oss',
		Cursor: '.cursor',
	};
	const appConfig = appConfigs[vscode.env.appName] ?? '.vscode';
	return path.join(os.homedir(), appConfig, 'extensions');
}

function getPackagePathFromSnippetPath(snippetPath: string): string {
	const extDirPath = __getExtensionsDirPath();
	const relative = path.relative(extDirPath, snippetPath);
	const extensionFolder = relative.split(path.sep)[0];
	return path.join(extDirPath, extensionFolder, 'package.json');
}

export async function getExtensionSnippetLangs(snippetPath: string): Promise<string[]> {
	const pkgPath = getPackagePathFromSnippetPath(snippetPath);
	const pkg = (await readJson(pkgPath)) as PackageJsonSnippetsSection;
	const snippets = pkg.contributes?.snippets as SnippetContribution[];

	const extPath = path.dirname(pkgPath);
	return snippets
		.filter(({ path: fp }) => snippetPath === path.resolve(extPath, fp))
		.map(({ language }) => language);
}

/**
 * Removes textmate snippet scopes from snippet objects
 */
export function flattenScopedExtensionSnippets(
	snippets: VSCodeSnippets | JSONObject
): VSCodeSnippets {
	return Object.values(snippets).some(
		(val) => ('prefix' in val || 'isFileTemplate' in val) && 'body' in val
	)
		? (snippets as VSCodeSnippets)
		: Object.values(snippets).reduce((acc: VSCodeSnippets, scopedSnippets) => {
				if (typeof scopedSnippets === 'object' && scopedSnippets !== null) {
					Object.entries(scopedSnippets).forEach(([key, snippet]) => {
						acc[key] = snippet as VSCodeSnippet;
					});
				}
				return acc;
			}, {});
}

// -------------------- All Extension Files --------------------

export async function findAllExtensionSnippetsFiles(): Promise<ExtensionSnippetFilesMap> {
	const dir = __getExtensionsDirPath();
	if (!(await exists(dir))) {
		return {};
	}

	const allDirents = await fs.readdir(dir, { withFileTypes: true });

	const tasks = allDirents.map(
		async (
			dirent
		): Promise<[string, { name: string; files: SnippetContribution[] }] | undefined> => {
			const pkgPath = path.join(dir, dirent.name, 'package.json');
			if (!(await exists(pkgPath))) {
				return;
			}

			const pkg = (await readJson(pkgPath)) as PackageJsonSnippetsSection;
			const snippets = pkg.contributes?.snippets;
			if (snippets) {
				snippets.forEach((snippet) => {
					snippet.path = path.resolve(dir, dirent.name, snippet.path);
				});
				return [dirent.name, { name: pkg.name, files: snippets }];
			}
		}
	);

	const snippetPaths = (await Promise.all(tasks)).filter((res) => Array.isArray(res));
	return Object.fromEntries(snippetPaths);
}

// -------------------- Get By Language --------------------

type ExtensionSnippetsMapKVP = [string, { name: string; snippets: ExtensionSnippets[] }];
type TaskResult = Promise<ExtensionSnippetsMapKVP | undefined>;

export async function findAllExtensionSnipppetsByLang(
	langId: string
): Promise<ExtensionSnippetsMap> {
	const extensionSnippetFilesMap = await findAllExtensionSnippetsFiles();
	if (Object.keys(extensionSnippetFilesMap).length === 0) {
		return {};
	}

	const tasks: TaskResult[] = Object.entries(extensionSnippetFilesMap).map(
		async ([extId, { name, files }]) => {
			const filesToRead = files.filter(({ language }) => language === langId);
			if (filesToRead.length === 0) {
				return;
			}

			const snippets = await readJsoncFilesAsync(filesToRead.map(({ path }) => path));
			const contributionsWithSnippets: ExtensionSnippets[] = snippets.map(([fp, s]) => {
				return {
					path: fp,
					language: langId,
					snippets: flattenScopedExtensionSnippets(s),
				};
			});
			const result: ExtensionSnippetsMapKVP = [
				extId,
				{ name, snippets: contributionsWithSnippets },
			];
			return result;
		}
	);

	const extensionSnippetMapKVPs = (await Promise.all(tasks)).filter((res) => Array.isArray(res));
	return Object.fromEntries(extensionSnippetMapKVPs);
}
