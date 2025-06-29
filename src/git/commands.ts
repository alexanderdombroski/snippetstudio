import simpleGit from 'simple-git';
import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import type { Octokit } from '@octokit/rest' with { 'resolution-mode': 'import' };

/**
 * Inits a repo if necessary
 * @returns false if can't init sucessfully
 */
export async function init(repoPath: string, url: string): Promise<boolean> {
	expandGitignore(repoPath);

	if (fs.existsSync(path.join(repoPath, '.git'))) {
		return true;
	}

	const git = simpleGit(repoPath);
	try {
		await git.init();
		await git.addRemote('origin', url);

		return true;
	} catch (error) {
		vscode.window.showErrorMessage(
			'Failed to initialize repository. Make sure Git is installed.'
		);
		return false;
	}
}

function expandGitignore(repoPath: string) {
	const ignorePath = path.join(repoPath, '.gitignore');
	const entriesToAdd = ['.env', 'temp/'];

	if (!fs.existsSync(ignorePath)) {
		fs.writeFileSync(ignorePath, entriesToAdd.join('\n') + '\n');
	} else {
		const current = fs
			.readFileSync(ignorePath, 'utf8')
			.split('\n')
			.map((line) => line.trim());
		const updated = [...new Set([...current, ...entriesToAdd])].filter(Boolean);
		fs.writeFileSync(ignorePath, updated.join('\n') + '\n');
	}
}

export async function getOriginRemote(repoPath: string): Promise<string | null> {
	const git = simpleGit(repoPath);
	try {
		const remotes = await git.getRemotes(true);
		const origin = remotes.find((remote) => remote.name === 'origin');
		return origin?.refs?.fetch ?? null;
	} catch {
		return null;
	}
}

export async function hasChangesToCommit(repoPath: string): Promise<boolean> {
	const git = simpleGit(repoPath);
	const status = await git.status();
	return (
		status.not_added.length > 0 ||
		status.created.length > 0 ||
		status.deleted.length > 0 ||
		status.modified.length > 0 ||
		status.renamed.length > 0 ||
		status.staged.length > 0
	);
}

export async function commitSnippets(repoPath: string, committer: { name: string; email: string }) {
	const git = simpleGit(repoPath);

	const ogName = process.env.GIT_COMMITTER_NAME;
	const ogEmail = process.env.GIT_COMMITTER_EMAIL;

	try {
		await git.add('.');

		process.env.GIT_COMMITTER_NAME = committer.name;
		process.env.GIT_COMMITTER_EMAIL = committer.email;

		await git.commit('Modified global snippets for vscode');
	} catch {
		vscode.window.showErrorMessage('Could not commit Snippets');
	} finally {
		if (ogName === undefined) {
			delete process.env.GIT_COMMITTER_NAME;
		} else {
			process.env.GIT_COMMITTER_NAME = ogName;
		}
		if (ogEmail === undefined) {
			delete process.env.GIT_COMMITTER_EMAIL;
		} else {
			process.env.GIT_COMMITTER_EMAIL = ogEmail;
		}
	}
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
