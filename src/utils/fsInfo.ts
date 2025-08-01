import * as vscode from 'vscode';
import path from 'path';
import os from 'os';

/**
 * Grabs the CWD workspace of VSCode
 *
 * @returns The open workspace folder or undefinied
 */
function getWorkspaceFolder(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (!workspaceFolders || workspaceFolders.length === 0) {
		return undefined;
	}

	// Index 0 is root folder
	return workspaceFolders[0].uri.fsPath;
}

function getCurrentUri(): vscode.Uri | undefined {
	return vscode.window.activeTextEditor?.document.uri;
}

export function shortenFullPath(fullPath: string): string {
	const homeDir = os.homedir();
	const resolvedhomeDir = path.resolve(homeDir);
	const resolvedPath = path.resolve(fullPath);

	if (resolvedPath.startsWith(resolvedhomeDir)) {
		return `~${resolvedPath.slice(resolvedhomeDir.length)}`;
	}

	return fullPath;
}

function getLangFromSnippetFilePath(filepath: string): string | undefined {
	if (path.extname(filepath) === '.code-snippets') {
		return;
	}

	const base = path.basename(filepath);
	const dotIndex = base.indexOf('.');
	if (dotIndex === -1) {
		return;
	}

	return base.substring(0, dotIndex);
}

function getDownloadsDirPath(): string {
	return path.join(os.homedir(), 'Downloads');
}

/**
 * isParentDir checks whether a given parent directory contains a given child path
 */
function isParentDir(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export {
	getWorkspaceFolder,
	getCurrentUri,
	getLangFromSnippetFilePath,
	getDownloadsDirPath,
	isParentDir,
};
