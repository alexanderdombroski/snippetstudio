import * as vscode from 'vscode';
import type { GlobalStorage } from '../types';
import { readJsonC } from './jsoncFilesIO';
import os from 'os';
import path from 'path';

let extensionContext: vscode.ExtensionContext | undefined;

export async function getExtensionContext(): Promise<vscode.ExtensionContext> {
	if (!extensionContext) {
		throw new Error('Extension context not correctly initialized');
	}
	return extensionContext;
}

/**
 * Initializes Global Context
 * @returns success or fail boolean
 */
export async function initGlobalStore(context: vscode.ExtensionContext): Promise<boolean> {
	extensionContext = context;
	const storage = await readGlobalStorage();
	if (storage) {
		context.globalState.update('users', storage.userDataProfiles ?? []);
		context.globalState.update('profileAssociations', storage.profileAssociations);
	}
	return !!storage;
}

/**
 * Reads the globalStorage/storage.json VS Code storage file
 */
async function readGlobalStorage(): Promise<GlobalStorage | undefined> {
	const userPath = initUserPath();
	if (userPath) {
		const globalStoragePath = path.join(userPath, 'globalStorage', 'storage.json');
		return (await readJsonC(globalStoragePath)) as GlobalStorage;
	}
}

function initUserPath(): string | undefined {
	try {
		const userPath = getUserPath();
		return userPath;
	} catch {
		vscode.window
			.showErrorMessage(
				`Unsupported platform: ${process.platform}. Couldn't find default user path. Want to submit an issue to request support for your device?`,
				'Open GitHub Issue'
			)
			.then((selection) => {
				if (selection === 'Open GitHub Issue') {
					vscode.env.openExternal(
						vscode.Uri.parse('https://github.com/alexanderdombroski/snippetstudio/issues')
					);
				}
			});
	}
}

export function getUserPath(): string {
	switch (process.platform) {
		case 'win32':
			return path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User');
		case 'linux':
			return path.join(os.homedir(), '.config', 'Code', 'User');
		case 'darwin':
			return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User');
		default:
			throw new Error("Unknown OS: Couldn't find user path");
	}
}
