import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { doesRepoExist, extractGitURL, getRepoDataFromUser } from './utils';
import { RepoData } from '../types/gitTypes';
import { setPreferredGlobalSnippetsRepo, settingAndRemoteMatch } from './settings';
import { getGlobalSnippetFilesDir } from '../utils/fsInfo';
import { cloneIntoPath, commitSnippets, getOriginRemote, push } from './commands';
import getOctokitClient from './octokit';
import { resetGlobalSnippets } from '../utils/jsoncFilesIO';
import { mergeGlobals } from '../snippets/fileMerge';

// ------------- ENTRY FUNCTION -------------

/**
 * Choose whether to use a github repo's snippets and start colaborating
 */
async function snippetMerge(context: vscode.ExtensionContext) {
	const repoPath = getGlobalSnippetFilesDir();
	if (repoPath === undefined) {
		return;
	}

	const remoteData = await getMergeRemote();
	if (remoteData === undefined) {
		return;
	}

	const client = await getOctokitClient(context);
	if (!(await doesRepoExist(client, remoteData.user, remoteData.repo))) {
		vscode.window.showErrorMessage(
			'Could not find repo on github. Make sure it exists and you have access.'
		);
		return;
	}

	const mergeOptions = [
		{
			label: 'Merge Snippets',
			description: 'Merge snippets from the remote repository without changing your remote.',
			run: mergeOnly,
		},
		{
			label: 'Collaborate',
			description:
				'Start with their snippets, merge yours, and set their repository as your remote.',
			run: collaborate,
		},
		{
			label: 'Start Fresh',
			description: 'Replace your local snippets with the ones from the remote repository.',
			run: reset,
		},
	];

	const selectedOption = await vscode.window.showQuickPick(mergeOptions, {
		placeHolder: 'Choose how to handle the snippet merge',
	});

	if (!selectedOption) {
		return;
	}

	await selectedOption.run(remoteData);

	await commitSnippets(
		repoPath,
		`Performed Merge Operation: ${selectedOption.label}\n\n${selectedOption.description}`
	);
	await push(repoPath);

	vscode.window.showInformationMessage(
		`Successfully performed merge (${selectedOption.label}): ${selectedOption.description}`
	);
}

// ------------- BIG THREE ACTIONS -------------

/**
 * Replace your local snippets with the ones from the remote repository.
 */
async function reset(remoteData: RepoData) {
	await resetGlobalSnippets();

	await setPreferredGlobalSnippetsRepo(remoteData.user, remoteData.repo);

	await vscode.commands.executeCommand('snippetstudio.github.sync');
}

/**
 * Merge snippets from the remote repository without changing your remote.
 */
async function mergeOnly(remoteData: RepoData) {
	const clonePath = path.join(getGlobalSnippetFilesDir() as string, 'temp');

	await resetTempDir(clonePath);

	if (!(await cloneIntoPath(clonePath, remoteData.url))) {
		return;
	}

	await mergeGlobals();
}

/**
 * Start with their snippets, merge yours, and set their repository as your remote.
 */
export async function collaborate(remoteData: RepoData) {
	const globalPath = getGlobalSnippetFilesDir() as string;

	const mergePath = path.join(globalPath, 'temp');
	const clonePath = path.join(globalPath, 'cloneTemp');

	const moveLocalPromise = (async () => {
		await resetTempDir(mergePath);
		await moveAllButTemp(globalPath, mergePath);
	})();
	const cloneRemotePromise = (async () => {
		await resetTempDir(clonePath);
		return await cloneIntoPath(clonePath, remoteData.url);
	})();

	const [, success] = await Promise.all([moveLocalPromise, cloneRemotePromise]);
	if (!success) {
		vscode.window.showWarningMessage(
			`Couldn't clone remote GitHub: ${remoteData.user}/${remoteData.repo}. Snippets should be unaffected.`
		);
	}

	await moveAllButTemp(clonePath, globalPath);
	await fs.promises.rm(clonePath, { recursive: true, force: true });

	await mergeGlobals();
}

// ------------- HELPERS -------------

async function moveAllButTemp(startDir: string, endDir: string) {
	const items = await fs.promises.readdir(startDir);
	const movePromises = items
		.filter((item) => item !== 'temp' && item !== 'cloneTemp')
		.map(async (item) => {
			const srcPath = path.join(startDir, item);
			const newPath = path.join(endDir, item);

			// Avoid moving endDir into itself
			if (path.resolve(srcPath) === path.resolve(endDir)) {
				return;
			}

			await fs.promises.rename(srcPath, newPath);
		});

	await Promise.all(movePromises);
}

/**
 * Clear a directory and recreate it
 */
async function resetTempDir(tempPath: string) {
	if (fs.existsSync(tempPath)) {
		await fs.promises.rm(tempPath, { recursive: true, force: true });
	}
	await fs.promises.mkdir(tempPath, { recursive: true });
}

/**
 * Get the remote to merge
 */
async function getMergeRemote(): Promise<RepoData | undefined> {
	const repoPath = getGlobalSnippetFilesDir();
	if (repoPath === undefined) {
		return;
	}

	const originUrl = await getOriginRemote(repoPath);
	if (originUrl === null) {
		vscode.window.showWarningMessage(
			"You haven't backed up your snippets yet. Use Sync first."
		);
		return;
	}

	const originData = extractGitURL(originUrl);
	if (originData === null) {
		return;
	}

	if (!settingAndRemoteMatch(originData.user, originData.repo)) {
		vscode.window.showWarningMessage(
			'Global Snippets actual remote != remote in settings. Use Sync first.'
		);
		return;
	}

	const mergeUrlData = await getRepoDataFromUser(
		'Enter the remote GitHub repository URL to merge'
	);
	if (mergeUrlData === null) {
		return;
	}

	if (settingAndRemoteMatch(mergeUrlData.user, mergeUrlData.repo)) {
		vscode.window.showWarningMessage('Cannot merge with existing remote. Use Sync instead.');
		return;
	}

	return mergeUrlData;
}

export { snippetMerge };
