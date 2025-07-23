import fs from 'fs';
import path from 'path';
import os from 'os';
import { readJson } from '../utils/jsoncFilesIO';
import type {
	ExtensionSnippetsMap,
	PackageJsonSnippetsSection,
	SnippetContribution,
} from '../types';

function getExtensionsDirPath(): string {
	return path.join(os.homedir(), '.vscode', 'extensions');
}

export async function findAllExtensionSnippets(): Promise<ExtensionSnippetsMap> {
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

	const snippetPaths = (await Promise.all(tasks)).filter((res) => typeof res === 'object');
	return Object.fromEntries(snippetPaths);
}
