import type { ExtensionContext } from 'vscode';
import vscode, { openExternal, showErrorMessage, Uri } from '../vscode';
import type { GlobalStorage } from '../types';
import { readJsonC } from './jsoncFilesIO';
import os from 'node:os';
import path from 'node:path';

let extensionContext: ExtensionContext | undefined;

/** gets the extension context saved globally */
export async function getExtensionContext(): Promise<ExtensionContext> {
	if (!extensionContext) {
		throw new Error('Extension context not correctly initialized');
	}
	return extensionContext;
}

/**
 * Initializes Global Context
 * @returns success or fail boolean
 */
export async function initGlobalStore(context: ExtensionContext): Promise<boolean> {
	extensionContext = context;
	const storage = await _readGlobalStorage();
	if (storage) {
		context.globalState.update('users', storage.userDataProfiles ?? []);
		context.globalState.update('profileAssociations', storage.profileAssociations);
	}
	return !!storage;
}

/** Reads the globalStorage/storage.json VS Code storage file */
export async function _readGlobalStorage(): Promise<GlobalStorage | undefined> {
	const userPath = _initUserPath();
	if (userPath) {
		const globalStoragePath = path.join(userPath, 'globalStorage', 'storage.json');
		return (await readJsonC(globalStoragePath)) as GlobalStorage;
	}
}

/** handles if a user path doesn't exist */
export function _initUserPath(): string | undefined {
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

/** returns the vscode user path based on platform and os */
export function getUserPath(): string {
	const appNames: Record<string, string> = {
		Antigravity: 'Antigravity',
		'Visual Studio Code': 'Code',
		'Visual Studio Code - Insiders': 'Code - Insiders',
		VSCodium: 'VSCodium',
		Cursor: 'Cursor',
		Trae: 'Trae',
	};
	const appName = appNames[vscode.env.appName] ?? 'Code';
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
