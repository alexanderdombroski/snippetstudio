import * as vscode from 'vscode';
import { buildGitURL, doesRepoExist, extractGitURL, getUsername } from './utils';
import getOctokitClient from './octokit';
import { getPreferredGlobalSnippetsRepo, setPreferredGlobalSnippetsRepo } from './settings';
import { RepoData } from '../types/gitTypes';
import type { Octokit } from '@octokit/rest' with { 'resolution-mode': 'import' };
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';
import { commitSnippets, getOriginRemote, hasChangesToCommit, init, pull, push } from './commands';
import { collaborate } from './snippetMerge';

/**
 * ENSURES THAT ALL REPOS ARE IN SYNC
 *
 * steps:
 * [X] Get the repo url data
 * [X] Init local and remote repo
 * [X] Commit changes
 * [X] Ensure that the local repo matches
 * [X] JSON merge if different repo
 * [X] JSON merge if conflicts
 *
 */
async function snippetSync(context: vscode.ExtensionContext) {
	const repoPath = getGlobalSnippetFilesDir();
	if (repoPath === undefined) {
		return;
	}

	const client = await getOctokitClient(context);

	const { user, repo, url } = await getPreferredRepo(client);
	vscode.window.showInformationMessage(`Started Sync to GitHub repo: ${user}/${repo}`);

	if (!(await init(repoPath, url))) {
		return;
	}

	if (await hasChangesToCommit(repoPath)) {
		await commitSnippets(repoPath, 'Modified global snippets for vscode');
	}

	if (!(await doesRepoExist(client, user, repo))) {
		if (user === (await getUsername(client))) {
			await client.repos.createForAuthenticatedUser({
				name: repo,
				description:
					'Global VS Code snippets managed through SnippetStudio VS Code extension',
			});
			if (await push(repoPath)) {
				vscode.window.showInformationMessage(
					`Successfully created repo: ${user}/${repo} and pushed snippets!`
				);
				return;
			}
		} else {
			vscode.window.showWarningMessage(
				`Github remote ${url} doesn't exist. Tell ${user} to create it!`
			);
			return;
		}
	}

	const currentRemote = await getOriginRemote(repoPath);
	if (!currentRemote?.includes(`${user}/${repo}`)) {
		await collaborate({ user, repo, url });
		await commitSnippets(
			repoPath,
			currentRemote === null
				? 'Progmatically resolved merge conflicts through JSON object merging'
				: `Added Snippets from ${extractGitURL(currentRemote)?.url ?? 'a new source'} and resolved conflicts`
		);
		await push(repoPath);
		return;
	}

	const success = (await pull(repoPath)) && (await push(repoPath));
	if (success) {
		vscode.window.showInformationMessage(`Sucessfully synced with ${url} without conflicts`);
		return;
	}

	await collaborate({ user, repo, url });

	await commitSnippets(
		repoPath,
		'Progmatically resolved merge conflicts through JSON object merging'
	);

	if (await push(repoPath)) {
		vscode.window.showInformationMessage(
			`Sucessfully resolved conflicts and synced with ${url}`
		);
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
