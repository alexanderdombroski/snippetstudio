import * as vscode from 'vscode';
import type { Octokit } from '@octokit/rest' with { 'resolution-mode': 'import' };
import { isNotFoundError } from '../utils/error';
import { RepoData } from '../types/gitTypes';

/**
 * Checks to see if repo exists on github
 */
export async function doesRepoExist(
	client: Octokit,
	owner: string,
	repo: string
): Promise<boolean> {
	try {
		await client.repos.get({ owner, repo });
		return true;
	} catch (error) {
		if (isNotFoundError(error)) {
			return false;
		}
		vscode.window.showErrorMessage(
			`SnippetStudio: Could not determine if a repo exists ${error}`
		);
		throw error;
	}
}

export async function getUsername(client: Octokit): Promise<string> {
	const { data } = await client.users.getAuthenticated();
	return data.login;
}

export function buildGitURL(username: string, repoName: string): string {
	return `https://github.com/${username}/${repoName}.git`;
}

/**
 * returns git https url parts, or null if git url is invalid
 */
export function extractGitURL(url: string): RepoData | null {
	const pattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i;
	const match = url.match(pattern);

	if (match) {
		return { url, user: match[1], repo: match[2] };
	}

	return null;
}

/**
 * Shows a input box and asks for a remote GitHub url
 */
export async function getRepoDataFromUser(prompt: string): Promise<RepoData | null> {
	const url = await vscode.window.showInputBox({
		prompt,
		placeHolder: 'https://github.com/user/repo.git',
	});
	if (url === undefined) {
		return null; // User pressed ESC
	}

	const urlData = extractGitURL(url);
	if (urlData) {
		return urlData;
	}

	vscode.window.showErrorMessage('Not a valid GitHub URL');
	return null;
}
