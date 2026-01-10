import type { Uri as UriType } from 'vscode';
import vscode from '../vscode';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';

/**
 * Grabs the CWD workspace of VSCode
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

/** returns the Uri of the active text editor */
function getCurrentUri(): UriType | undefined {
	return vscode.window.activeTextEditor?.document.uri;
}

/** uses '~' version of user path if applicable */
function shortenFullPath(fullPath: string): string {
	const homeDir = os.homedir();
	const resolvedhomeDir = path.resolve(homeDir);
	const resolvedPath = path.resolve(fullPath);

	if (resolvedPath.startsWith(resolvedhomeDir)) {
		return `~${resolvedPath.slice(resolvedhomeDir.length)}`.replace(/\\/g, '/');
	}

	return fullPath;
}

/** returns downloads directory path */
function getDownloadsDirPath(): string {
	return path.join(os.homedir(), 'Downloads');
}

/** isParentDir checks whether a given parent directory contains a given child path */
function isParentDir(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/** Detects whether snippet originates in extension folder */
function isExtensionSnippetPath(fp: string): boolean {
	const dir = path.posix.dirname(fp);
	return /.+\/extensions\/[^/]+\/snippets$/.test(dir);
}

/** Check if a file/folder exists */
async function exists(fp: string): Promise<boolean> {
	try {
		await fs.access(fp);
		return true;
	} catch {
		return false;
	}
}

export {
	getWorkspaceFolder,
	getCurrentUri,
	shortenFullPath,
	isExtensionSnippetPath,
	getDownloadsDirPath,
	isParentDir,
	exists,
};
