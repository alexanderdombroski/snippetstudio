import vscode, { openExternal, showErrorMessage, Uri } from '../vscode';
import type { GlobalStorage } from '../types';
import { readJsonC } from './jsoncFilesIO';
import os from 'node:os';
import path from 'node:path';

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
	const storage = await __readGlobalStorage();
	if (storage) {
		context.globalState.update('users', storage.userDataProfiles ?? []);
		context.globalState.update('profileAssociations', storage.profileAssociations);
	}
	return !!storage;
}

/**
 * Reads the globalStorage/storage.json VS Code storage file
 */
export async function __readGlobalStorage(): Promise<GlobalStorage | undefined> {
	const userPath = __initUserPath();
	if (userPath) {
		const globalStoragePath = path.join(userPath, 'globalStorage', 'storage.json');
		return (await readJsonC(globalStoragePath)) as GlobalStorage;
	}
}

export function __initUserPath(): string | undefined {
	try {
		const userPath = getUserPath();
		return userPath;
	} catch {
		showErrorMessage(
			`Unsupported platform: ${process.platform}. Couldn't find default user path. Want to submit an issue to request support for your device?`,
			'Open GitHub Issue'
		).then((selection) => {
			if (selection === 'Open GitHub Issue') {
				openExternal(Uri.parse('https://github.com/alexanderdombroski/snippetstudio/issues'));
			}
		});
	}
}

export function getUserPath(): string {
	const appName = vscode.env.appName === 'Visual Studio Code' ? 'Code' : 'Code - Insiders';
	switch (process.platform) {
		case 'win32':
			return path.join(os.homedir(), 'AppData', 'Roaming', appName, 'User');
		case 'linux':
			return path.join(os.homedir(), '.config', appName, 'User');
		case 'darwin':
			return path.join(os.homedir(), 'Library', 'Application Support', appName, 'User');
		default:
			throw new Error("Unknown OS: Couldn't find user path");
	}
}
