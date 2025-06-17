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

function getGlobalSnippetFilesDir(): string | undefined {
	let globalSnippetsPath: string = '';
	switch (process.platform) {
		case 'win32':
			globalSnippetsPath = path.join(
				os.homedir(),
				'AppData',
				'Roaming',
				'Code',
				'User',
				'snippets'
			);
			break;
		case 'linux':
			globalSnippetsPath = path.join(os.homedir(), '.config', 'Code', 'User', 'snippets');
			break;
		case 'darwin':
			globalSnippetsPath = path.join(
				os.homedir(),
				'Library',
				'Application Support',
				'Code',
				'User',
				'snippets'
			);
			break;
		default:
			vscode.window.showErrorMessage(
				`Unsupported platform: ${process.platform} Couldn't find global snippets file`
			);
			return undefined;
	}
	return globalSnippetsPath;
}

function getGlobalLangFile(langId: string): string {
	const dir = getGlobalSnippetFilesDir();
	if (dir === undefined) {
		return '';
	}
	return path.join(dir, `${langId}.json`);
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

export {
	getWorkspaceFolder,
	getGlobalSnippetFilesDir,
	getCurrentUri,
	getGlobalLangFile,
	getLangFromSnippetFilePath,
	getDownloadsDirPath,
};
