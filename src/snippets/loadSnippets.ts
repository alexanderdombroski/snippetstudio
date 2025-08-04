import vscode, { getConfiguration, None, Collapsed } from '../vscode';
import { readJsoncFilesAsync } from '../utils/jsoncFilesIO';
import type { VSCodeSnippets } from '../types';
import { locateSnippetFiles } from './locateSnippets';
import { createTreeItemFromFilePath, createTreeItemFromSnippet } from '../ui/templates';
import { getCurrentLanguage } from '../utils/language';
import { getLinkedSnippets } from './links/config';
import { getProfileIdFromPath } from '../utils/profile';
import path from 'node:path';

export default async function loadSnippets(): Promise<[vscode.TreeItem, vscode.TreeItem[]][]> {
	const snippetFiles: string[] = await locateSnippetFiles();
	const snippetGroups: [string, VSCodeSnippets][] = await readJsoncFilesAsync(snippetFiles);
	const langId = getCurrentLanguage() ?? 'None Selected';
	const linkedSnippets = await getLinkedSnippets();
	const treeItems: [vscode.TreeItem, vscode.TreeItem[]][] = snippetGroups.map(
		([filePath, group]) => {
			const snippets = Object.entries(group)
				.filter(
					([, v]) =>
						v.scope === undefined || v.scope === langId || v.scope.split(',').includes(langId)
				)
				.map(([k, v]) => createTreeItemFromSnippet(k, v, filePath));
			const basename = path.basename(filePath);
			const dropdown = createTreeItemFromFilePath(
				filePath,
				snippets.length === 0 ? None : Collapsed,
				basename in linkedSnippets &&
					linkedSnippets[basename].includes(getProfileIdFromPath(filePath))
					? 'snippet-filepath linked'
					: 'snippet-filepath'
			);
			return [dropdown, snippets];
		}
	);

	if (getConfiguration('snippetstudio').get<boolean>('alwaysShowProjectSnippetFiles') === false) {
		return treeItems.filter(([dropdown]) => dropdown.collapsibleState !== None);
	}

	return treeItems;
}
