import type { ExtensionContext } from 'vscode';
import vscode, { openExternal, showErrorMessage, Uri } from '../vscode';
import type { GlobalStorage } from '../types';
import { readJsonC } from './jsoncFilesIO';
import os from 'node:os';
import path from 'node:path';
import { exists } from './fsInfo';

let extensionContext: ExtensionContext | undefined;

/** gets the extension context saved globally */
export function getExtensionContext(): ExtensionContext {
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
		if (!(await exists(globalStoragePath))) {
			return { userDataProfiles: [], profileAssociations: { emptyWindows: {}, workspaces: {} } };
		}
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
		Windsurf: 'Windsurf',
		Kiro: 'Kiro',
		Trae: 'Trae',
		AbacusAI: 'AbacusAI',
		'code-server': 'code-server',
	};
	const appName = appNames[vscode.env.appName] ?? 'Code';
	if (appName === 'code-server' && process.platform !== 'win32')
		return path.join(os.homedir(), '.local', 'share', 'code-server', 'User');
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

type SemVer = {
	major: number;
	minor: number;
	patch: number;
	prerelease?: string;
};

/** Returns details about the VS Code API version */
export function getVersion(): SemVer | null {
	const match = vscode.version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/);

	if (!match) return null;

	const [, major, minor, patch, prerelease] = match;

	const semVer: SemVer = {
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
	};

	if (prerelease) {
		semVer.prerelease = prerelease;
	}

	return semVer;
}
