// Utilities for interacting with VS Code profiles
import * as vscode from 'vscode';
import path from 'path';
import { getUserPath } from './fsInfo';
import type { GlobalStorage, ProfileInfo } from '../types';
import { readJsonC } from './jsoncFilesIO';

/**
 * Reads the globalStorage/storage.json VS Code storage file
 */
async function readGlobalStorage(): Promise<GlobalStorage | undefined> {
	const userPath = getUserPath();
	if (userPath) {
		const globalStoragePath = path.join(userPath, 'globalStorage', 'storage.json');
		return (await readJsonC(globalStoragePath)) as GlobalStorage;
	}
}

/**
 * Returns [active profile, all profiles]
 */
async function readProfileInfo(): Promise<[ProfileInfo, ProfileInfo[]]> {
	const storage = await readGlobalStorage();
	const activeProfile = await getActiveProfile(storage);

	return [activeProfile, storage?.userDataProfiles ?? [getDefaultProfile()]];
}

const getDefaultProfile = () => ({ id: '__default__profile__', name: 'Default' }) as const;

async function getActiveProfile(storage?: GlobalStorage): Promise<ProfileInfo> {
	storage ??= await readGlobalStorage();
	const uri = vscode.workspace.workspaceFolders?.[0]?.uri.toString() as string;
	return (
		storage?.userDataProfiles?.find(
			(p) => p.id === storage.profileAssociations.workspaces[uri]
		) ?? getDefaultProfile()
	);
}

export { readProfileInfo, getDefaultProfile };
