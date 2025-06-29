import * as vscode from 'vscode';
import { buildGitURL, doesRepoExist, extractGitURL, getUsername } from './utils';
import getOctokitClient from './octokit';
import { getPreferredGlobalSnippetsRepo, setPreferredGlobalSnippetsRepo } from './settings';
import { RepoData } from '../types/gitTypes';
import type { Octokit } from '@octokit/rest' with { 'resolution-mode': 'import' };
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';
import { commitSnippets, getOriginRemote, hasChangesToCommit, init, pull } from './commands';

/**
 * ENSURES THAT ALL REPOS ARE IN SYNC
 *
 * steps:
 * [X] Get the repo url data
 * [X] Init local and remote repo
 * [X] Commit changes
 * [X] Ensure that the local repo matches
 *
 */
async function snippetSync(context: vscode.ExtensionContext) {
	const client = await getOctokitClient(context);
	const repoPath = getGlobalSnippetFilesDir();
	if (repoPath === undefined) {
		return;
	}

	const { user, repo, url } = await getPreferredRepo(client);

	init(repoPath, url);

	if (await hasChangesToCommit(repoPath)) {
		await commitSnippets(repoPath, {
			name: 'SnippetStudio[bot]',
			email: 'snippetstudio@noreply.local',
		});
	}

	if (!(await doesRepoExist(client, user, repo))) {
		if (user === (await getUsername(client))) {
			await client.repos.createForAuthenticatedUser({ name: repo });
		} else {
			vscode.window.showWarningMessage(
				`Github remote ${url} doesn't exist. Tell ${user} to create it!`
			);
			return;
		}
	}

	const currentRemote = await getOriginRemote(repoPath);
	if (!currentRemote?.includes(`${user}/${repo}`)) {
		// TODO - Merge Repos!!
		vscode.window.showWarningMessage('MERGING NOT IMPLIMENTED YET!');
		return;
	}

	const success = await pull(repoPath);
	if (!success) {
		// TODO - Merge Repos!!
		vscode.window.showWarningMessage('MERGE CONFLICT! MERGING NOT IMPLIMENTED YET!');
		return;
	}
}

/**
 * Return the information about the preferred globalSnippetsRepo
 */
async function getPreferredRepo(client: Octokit): Promise<RepoData> {
	const data = getPreferredGlobalSnippetsRepo();
	// using URL stored in settings
	if (data) {
		return data;
	}

	const username = await getUsername(client);
	const fallbackName = 'snippetstudio-vscode-snippets';
	const url = await vscode.window.showInputBox({
		value: buildGitURL(username, fallbackName),
		prompt: 'Fill in the git URL to store snippets, or ENTER to use default',
	});

	// User used custom URL
	if (url) {
		const data = extractGitURL(url);
		if (data) {
			setPreferredGlobalSnippetsRepo(data.user, data.repo);
			return data;
		}
	}

	// User pressed ESC, using default
	setPreferredGlobalSnippetsRepo(username, fallbackName);
	return { user: username, repo: fallbackName, url: buildGitURL(username, fallbackName) };
}

export { snippetSync };
