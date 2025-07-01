import * as vscode from 'vscode';
import { RepoData } from '../types/gitTypes';
import { buildGitURL, extractGitURL } from './utils';

export function getPreferredGlobalSnippetsRepo(): RepoData | null {
	const config = vscode.workspace.getConfiguration('snippetstudio.github');
	const url = config.get<string>('globalSnippetsRepository');
	if (url === undefined) {
		return null;
	}

	const data = extractGitURL(url);

	if (data) {
		return data;
	}

	vscode.window.showErrorMessage(
		`Specified repo in setting: snippetstudio.github.globalSnippetsRepository isn't a recognized git URL: ${url}`
	);
	return null;
}

export async function setPreferredGlobalSnippetsRepo(username: string, repoName: string) {
	const config = vscode.workspace.getConfiguration('snippetstudio.github');
	const url = buildGitURL(username, repoName);
	await config.update('globalSnippetsRepository', url);
}

export function settingAndRemoteMatch(username: string, repoName: string): boolean {
	const settingData = getPreferredGlobalSnippetsRepo();
	if (settingData === null) {
		return false;
	}

	return settingData?.repo === repoName && settingData?.user === username;
}
