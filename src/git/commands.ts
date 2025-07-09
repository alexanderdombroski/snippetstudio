import simpleGit from 'simple-git';
import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

/**
 * Inits a repo if necessary
 * @returns false if can't init sucessfully
 */
export async function init(repoPath: string, url: string): Promise<boolean> {
	const git = simpleGit(repoPath);

	if (fs.existsSync(path.join(repoPath, '.git'))) {
		return true;
	}

	try {
		await git.init();
		await git.addRemote('origin', url);
		return true;
	} catch {
		return false;
	}
}

export async function getOriginRemote(repoPath: string): Promise<string | null> {
	const git = simpleGit(repoPath);
	try {
		const remotes = await git.getRemotes(true);
		const origin = remotes.find((remote: { name: string }) => remote.name === 'origin');
		return origin?.refs?.fetch ?? null;
	} catch {
		return null;
	}
}

/**
 * Changes a remote. This will fail if the remote wasn't added in the first place.
 */
export async function changeRemote(repoPath: string, newRemote: string): Promise<boolean> {
	const git = simpleGit(repoPath);
	try {
		await git.remote(['set-url', 'origin', newRemote]);
		return true;
	} catch {
		return false;
	}
}

export async function getCurrentBranch(repoPath: string): Promise<string | null> {
	const git = simpleGit(repoPath);
	try {
		const branchSummary = await git.branch();
		return branchSummary.current;
	} catch (error) {
		return null;
	}
}

export async function hasChangesToCommit(repoPath: string): Promise<boolean> {
	const git = simpleGit(repoPath);
	try {
		const status = await git.status();
		return (
			status.not_added.length > 0 ||
			status.created.length > 0 ||
			status.deleted.length > 0 ||
			status.modified.length > 0 ||
			status.renamed.length > 0 ||
			status.staged.length > 0
		);
	} catch {
		return false;
	}
}

export async function commitSnippets(
	repoPath: string,
	message: string,
	author: { name: string; email: string } = {
		name: 'SnippetStudio[bot]',
		email: 'snippetstudio@noreply.local',
	}
) {
	const git = simpleGit(repoPath);

	try {
		await git.add('.');
		await git.commit(message, { '--author': `${author.name} <${author.email}>` });
	} catch {
		vscode.window.showErrorMessage('Could not commit Snippets');
	}
}

/**
 * Try pushing, if failed, push and set upstream
 * Returns true on success
 */
export async function push(repoPath: string): Promise<boolean> {
	const git = simpleGit(repoPath);
	const branch = (await getCurrentBranch(repoPath)) as string;
	try {
		await git.push('origin', branch);
	} catch {
		try {
			await git.push(['-u', 'origin', branch]);
		} catch {
			return false;
		}
	}
	return true;
}

/**
 * Tries to pull and returns success boolean flag
 */
export async function pull(repoPath: string): Promise<boolean> {
	const git = simpleGit(repoPath);
	try {
		await git.pull();
		return true;
	} catch {
		return false;
	}
}

export async function cloneIntoPath(clonePath: string, remoteUrl: string): Promise<boolean> {
	const git = simpleGit();
	try {
		await git.clone(remoteUrl, clonePath);
		return true;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to clone repository from ${remoteUrl}.`);
		return false;
	}
}
