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
		await pull(repoPath);
		await expandGitignore(repoPath);
		return true;
	}

	Promise.allSettled([expandGitignore(repoPath), createReadme(repoPath)]);

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

async function expandGitignore(repoPath: string) {
	const ignorePath = path.join(repoPath, '.gitignore');
	const entriesToAdd = ['.env', 'temp/', '.DS_Store'];

	if (!fs.existsSync(ignorePath)) {
		fs.writeFileSync(ignorePath, entriesToAdd.join('\n') + '\n');
	} else {
		const current = fs
			.readFileSync(ignorePath, 'utf8')
			.split('\n')
			.map((line) => line.trim());
		const updated = [...new Set([...current, ...entriesToAdd])].filter(Boolean);
		await fs.promises.writeFile(ignorePath, updated.join('\n') + '\n');
	}
}
async function createReadme(repoPath: string) {
	const readPath = path.join(repoPath, 'README.md');
	if (!fs.existsSync(readPath)) {
		const text = [
			'# My VS Code Snippets',
			'Read [documentation](https://code.visualstudio.com/docs/editing/userdefinedsnippets) to learn more about snippets!',
			'Use the [SnippetStudio extension](https://marketplace.visualstudio.com/items?itemName=AlexDombroski.snippetstudio) to easier manage and create snippets! Or also check out the source code on [GitHub](https://github.com/alexanderdombroski/snippetstudio)',
		].join('\n\n');
		await fs.promises.writeFile(readPath, text);
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
	committer: { name: string; email: string } = {
		name: 'SnippetStudio[bot]',
		email: 'snippetstudio@noreply.local',
	}
) {
	const git = simpleGit(repoPath);

	const ogName = process.env.GIT_COMMITTER_NAME;
	const ogEmail = process.env.GIT_COMMITTER_EMAIL;

	try {
		await git.add('.');

		process.env.GIT_COMMITTER_NAME = committer.name;
		process.env.GIT_COMMITTER_EMAIL = committer.email;

		await git.commit(message);
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
