// Utilities for interacting with VS Code profiles
import vscode from '../vscode';
import path from 'node:path';
import type { ProfileInfo, ProfileAssociations } from '../types';
import { getExtensionContext, getUserPath } from './context';

const DEFAULT_PROFILE_ID = '__default__profile__';
const getDefaultProfile = () => ({ location: DEFAULT_PROFILE_ID, name: 'Default' }) as const;

/**
 * Returns a list of all Profiles
 */
async function getProfiles(): Promise<ProfileInfo[]> {
	const context = await getExtensionContext();
	const profiles = context.globalState.get<ProfileInfo[]>('users') ?? [];
	return [...profiles, getDefaultProfile()];
}

/**
 * Returns the active VS Code profile
 */
async function getActiveProfile(): Promise<ProfileInfo> {
	const context = await getExtensionContext();
	const profileAssociations = context.globalState.get<ProfileAssociations>('profileAssociations');
	const userDataProfiles = await getProfiles();
	const uri = vscode.workspace.workspaceFolders?.[0]?.uri.toString() as string;
	return (
		userDataProfiles.find((p) => p.location === profileAssociations?.workspaces?.[uri]) ??
		getDefaultProfile()
	);
}

/**
 * Returns the user path for the active profile
 */
async function getActiveProfilePath(): Promise<string> {
	const profile = await getActiveProfile();
	const userPath = getUserPath();
	return profile.location === DEFAULT_PROFILE_ID
		? userPath
		: path.join(userPath, 'profiles', profile.location);
}

/**
 * Gets the folderpath for the active user
 */
async function getActiveProfileSnippetsDir(): Promise<string> {
	const profilePath = await getActiveProfilePath();
	return path.join(profilePath, 'snippets');
}

/**
 * Given a language identifier, return the global snippet path for the active user
 */
async function getGlobalLangFile(langId: string): Promise<string> {
	const snippetsPath = await getActiveProfileSnippetsDir();
	return path.join(snippetsPath, `${langId}.json`);
}

/**
 * Gets all the global snippet paths and returns [] if none
 */
async function getAllGlobalSnippetDirs(): Promise<string[]> {
	const profiles = await getProfiles();
	return profiles.map((p) => getPathFromProfileLocation(p.location));
}

/**
 * Returns the snippets path for the given profile
 */
function getPathFromProfileLocation(location: string): string {
	return location === DEFAULT_PROFILE_ID
		? path.join(getUserPath(), 'snippets')
		: path.join(getUserPath(), 'profiles', location, 'snippets');
}

/**
 * Extracts the profile id from the snippets path
 */
function getProfileIdFromPath(filePath: string): string {
	const parts = filePath.split(path.sep);

	const profilesIndex = parts.indexOf('profiles');
	if (profilesIndex !== -1 && parts.length > profilesIndex + 1) {
		return parts[profilesIndex + 1]; // returns profile hash
	}

	if (parts.includes('User')) {
		return '__default__profile__';
	}

	throw new Error(`Invalid snippet path: ${filePath}`);
}

export {
	getProfiles,
	getActiveProfile,
	getGlobalLangFile,
	getActiveProfilePath,
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getProfileIdFromPath,
	getAllGlobalSnippetDirs,
};
