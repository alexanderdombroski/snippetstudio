import path from 'path';
import { getUserPath } from '../utils/context';
import { readJsonC, writeJson } from '../utils/jsoncFilesIO';
import type { JSONObject } from '../types';
import { getProfiles } from '../utils/profile';
import { isParentDir } from '../utils/fsInfo';

/**
 * Updates all settings.json files to add the target filename
 */
export async function addFileLink(filename: string) {
	const links = await getLinkedSnippets();
	links.push(filename);

	await updateAllSettings(links);
}

/**
 * Updates all settings.json files to remove the target filename
 */
export async function removeFileLink(filename: string) {
	const links = await getLinkedSnippets();
	const updated = links.filter((link) => link !== filename);

	await updateAllSettings(updated);
}

/**
 * Returns the linked snippet file basenames
 */
export async function getLinkedSnippets(): Promise<string[]> {
	const settingsPath = path.join(getUserPath(), 'settings.json');
	const settings = (await readJsonC(settingsPath)) as JSONObject;
	return (settings['snippetstudio.file.linkedFiles'] as string[]) ?? [];
}

async function updateAllSettings(newLinksValue: string[]) {
	const { createFile } = await import('../snippets/newSnippetFile.js');
	const profiles = await getProfiles();
	const paths = profiles.map((p) => {
		return p.location === '__default__profile__'
			? path.join(getUserPath(), 'settings.json')
			: path.join(getUserPath(), 'profiles', p.location, 'settings.json');
	});

	await Promise.all(
		paths.map(async (settingFile) => {
			await createFile(settingFile, false);
			const settings = (await readJsonC(settingFile)) as JSONObject;
			settings['snippetstudio.file.linkedFiles'] = newLinksValue;
			await writeJson(settingFile, settings);
		})
	);
}

export async function fileIsLinked(filepath: string): Promise<boolean> {
	if (!isParentDir(getUserPath(), filepath)) {
		return false;
	}
	const links = await getLinkedSnippets();
	return links.includes(path.basename(filepath));
}
