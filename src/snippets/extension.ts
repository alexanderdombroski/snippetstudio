import fs from 'fs';
import path from 'path';
import os from 'os';
import { readJson, readJsoncFilesAsync } from '../utils/jsoncFilesIO';
import type {
	ExtensionSnippetFilesMap,
	ExtensionSnippets,
	ExtensionSnippetsMap,
	PackageJsonSnippetsSection,
	SnippetContribution,
} from '../types';

function getExtensionsDirPath(): string {
	return path.join(os.homedir(), '.vscode', 'extensions');
}

function getPackagePathFromSnippetPath(snippetPath: string): string {
	const extDirPath = getExtensionsDirPath();
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

// -------------------- All Extension Files --------------------

export async function findAllExtensionSnippetsFiles(): Promise<ExtensionSnippetFilesMap> {
	const dir = getExtensionsDirPath();
	if (!fs.existsSync(dir)) {
		return {};
	}

	const allDirents = fs.readdirSync(dir, { withFileTypes: true });

	const tasks = allDirents.map(
		async (
			dirent
		): Promise<[string, { name: string; files: SnippetContribution[] }] | undefined> => {
			const pkgPath = path.join(dir, dirent.name, 'package.json');
			if (!fs.existsSync(pkgPath)) {
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
			const contributionsWithSnippets: ExtensionSnippets[] = snippets.map(([fp, s]) => ({
				path: fp,
				language: langId,
				snippets: s,
			}));
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
