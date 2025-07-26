// Utilities for interacting with VS Code profiles
import * as vscode from 'vscode';
import path from 'path';
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
 * Returns the filepath of the user's keybindings.json file, if it exists.
 */
async function getKeybindingsFilePath(): Promise<string> {
	const profilePath = await getActiveProfilePath();
	return path.join(profilePath, 'keybindings.json');
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
	return profiles.map((p) => getPathFromProfile(p));
}

/**
 * Returns the snippets path for the given profile
 */
function getPathFromProfile(profile: ProfileInfo): string {
	return profile.location === DEFAULT_PROFILE_ID
		? path.join(getUserPath(), 'snippets')
		: path.join(getUserPath(), 'profiles', profile.location, 'snippets');
}

export {
	getProfiles,
	getActiveProfile,
	getGlobalLangFile,
	getKeybindingsFilePath,
	getActiveProfileSnippetsDir,
	getPathFromProfile,
	getAllGlobalSnippetDirs,
};
