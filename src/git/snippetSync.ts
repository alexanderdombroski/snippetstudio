import * as vscode from 'vscode';
import { buildGitURL, doesRepoExist, extractGitURL, getUsername } from './utils';
import getOctokitClient from './octokit';
import { getPreferredGlobalSnippetsRepo, setPreferredGlobalSnippetsRepo } from './settings';
import { RepoData } from '../types/gitTypes';
import type { Octokit } from '@octokit/core' with { 'resolution-mode': 'import' };
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';
import {
	changeRemote,
	commitSnippets,
	getOriginRemote,
	hasChangesToCommit,
	init,
	pull,
	push,
} from './commands';
{
}
import { collaborate } from './snippetMerge';
import { showWarningWithFolderOpenButton } from '../utils/user';
import { createReadme, expandGitignore } from './file';

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
		vscode.window.showWarningMessage(
			'Failed to init repo. Make sure Git is installed. Aborting.'
		);
		return;
	}

	const needsToCommit = await hasChangesToCommit(repoPath);
	if (needsToCommit) {
		await commitSnippets(repoPath, 'Modified global snippets for vscode');
	}

	const currentRemote = await getOriginRemote(repoPath);
	const remoteIsSame = currentRemote?.includes(`${user}/${repo}.git`) ?? false;

	if (!(await doesRepoExist(client, user, repo))) {
		if (user === (await getUsername(client))) {
			if (!remoteIsSame && !(await changeRemote(repoPath, url))) {
				showWarningWithFolderOpenButton(
					`Failed to change the remote from ${currentRemote ?? 'unknown'} to ${url}. Didn't create repo on github.`
				);
				return;
			}

			await Promise.allSettled([
				expandGitignore(repoPath),
				createReadme(repoPath),
				client.request('POST /user/repos', {
					name: repo,
					description:
						'Global VS Code snippets managed through the SnippetStudio VS Code extension',
				}),
			]);

			await commitSnippets(repoPath, 'updated readme and gitignore');

			if (await push(repoPath)) {
				vscode.window.showInformationMessage(
					`Successfully created repo: ${user}/${repo} and pushed snippets!`
				);
				await addLicense(client, user);
			} else {
				await showWarningWithFolderOpenButton(
					`Successfully created repo: ${user}/${repo} but failed to pushed snippets!`
				);
			}
			return;
		} else {
			vscode.window.showWarningMessage(
				`Github remote ${url} doesn't exist. Tell ${user} to create it!`
			);
			return;
		}
	}

	if (remoteIsSame) {
		if (!needsToCommit) {
			if (await pull(repoPath)) {
				vscode.window.showInformationMessage(
					'No snippets to send to github. Pulled in remote snippets if any.'
				);
			} else {
				showWarningWithFolderOpenButton('Nothing to push; Pull failed.');
			}
			return;
		}

		const success = (await pull(repoPath)) && (await push(repoPath));
		if (success) {
			vscode.window.showInformationMessage(
				`Sucessfully synced with ${user}/${repo} without conflicts`
			);
			return;
		}

		vscode.window.showInformationMessage(
			'Merge Conflict Detected. Starting with remote snippets and merging locals.'
		);

		await collaborate({ user, repo, url });
		const message = `Added Snippets and programmatically resolved conflicts via json object merging`;
		await commitSnippets(repoPath, message);
		vscode.window.showInformationMessage(
			`${(await push(repoPath)) ? '' : 'Failed'} Pushed; Last commit: ${message}`
		);
		return;
	}

	if (!(await changeRemote(repoPath, url))) {
		showWarningWithFolderOpenButton(
			`Failed to change the remote from ${currentRemote ?? 'unknown'} to ${url}`
		);
		return;
	}

	await collaborate({ user, repo, url });

	await commitSnippets(
		repoPath,
		`Added Snippets from ${currentRemote} and resolved conflicts via json object merging`
	);

	if (await push(repoPath)) {
		vscode.window.showInformationMessage(
			`Sucessfully resolved conflicts and synced with ${user}/${repo}`
		);
	} else {
		showWarningWithFolderOpenButton(
			`Went through process to change the remote from ${currentRemote ?? 'unknown'} to ${url}, but final push failed after attempting to resolve conflicts.`
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

async function addLicense(client: Octokit, user: string, repo: string = 'github-secrets-demo') {
	const { data: licenses } = await client.request('GET /licenses');

	const choices: vscode.QuickPickItem[] = licenses.map(({ name, key }) => ({
		label: name,
		description: key,
	}));
	choices.unshift({ label: 'none', description: "Don't add a license file right now." });

	const selected = await vscode.window.showQuickPick(choices, {
		placeHolder: `Choose a license to add to repo: ${user}/${repo}`,
	});
	if (!selected?.description || selected.label === 'none') {
		return;
	}

	const {
		data: { body },
	} = await client.request('GET /licenses/{license}', {
		license: selected.description,
	});

	const year = new Date().getFullYear();
	const licenseText = body.replace(/\[year\]/gi, year.toString()).replace(/\[fullname\]/gi, user);

	const contentBase64 = Buffer.from(licenseText).toString('base64');

	await client.request('PUT /repos/{owner}/{repo}/contents/LICENSE', {
		owner: user,
		repo,
		message: `Add ${selected.description.toUpperCase()} license`,
		content: contentBase64,
	});

	vscode.window.showInformationMessage(`Added ${selected.label} license to ${repo}`);
}

export { snippetSync };
