import path from 'node:path';
import { getUserPath } from '../../utils/context';
import { readJsonC, writeJson } from '../../utils/jsoncFilesIO';
import type { JSONObject, SnippetLinks } from '../../types';
import {
	getActiveProfile,
	getPathFromProfileLocation,
	getProfileIdFromPath,
	getProfiles,
} from '../../utils/profile';
import { exists, isParentDir } from '../../utils/fsInfo';

/** Updates all settings.json files to add the target filename */
export async function addFileLink(filename: string, profileLocations: string[]) {
	const links = await getLinkedSnippets();
	links[filename] = profileLocations;

	await updateAllSettings(links);
}

/** Updates all settings.json files to remove the target filename */
export async function removeFileLink(filename: string) {
	const links = await getLinkedSnippets();
	delete links[filename];

	await updateAllSettings(links);
}

/** Returns the linked snippet file basenames */
export async function getLinkedSnippets(): Promise<SnippetLinks> {
	const settingsPath = path.join(getUserPath(), 'settings.json');
	if (!(await exists(settingsPath))) {
		return {};
	}
	const settings = (await readJsonC(settingsPath)) as JSONObject;
	let links = settings['snippetstudio.file.linkedFiles'] as string[] | SnippetLinks | undefined;
	if (Array.isArray(links)) {
		// TODO - remove in 3 months (for backwards compatibility)
		const locations = (await getProfiles()).map(({ location }) => location);
		links = Object.fromEntries(links.map((filename) => [filename, locations]));
	}
	return links ?? {};
}

/** Create or Read settings file, and write snippet links to settings */
export async function updateAllSettings(newLinksValue: SnippetLinks) {
	const { createFile } = await import('../newSnippetFile.js');
	const profiles = await getProfiles();
	const paths = profiles.map((p) => {
		return p.location === '__default__profile__'
			? path.join(getUserPath(), 'settings.json')
			: path.join(getUserPath(), 'profiles', p.location, 'settings.json');
	});

	await Promise.all(
		paths.map(async (settingFile) => {
			await createFile(settingFile, false, true);
			const settings = (await readJsonC(settingFile)) as JSONObject;
			settings['snippetstudio.file.linkedFiles'] = newLinksValue;
			await writeJson(settingFile, settings);
		})
	);
}

/** Gets the link paths for a given filepath */
export async function getLinkLocations(filepath: string): Promise<string[]> {
	if (!isUserSnippet(filepath)) {
		return [];
	}
	const linkedSnippets = await getLinkedSnippets();
	const links = linkedSnippets[path.basename(filepath)];
	if (links?.includes(getProfileIdFromPath(filepath))) {
		return links.map((location) => getPathFromProfileLocation(location));
	}
	return [];
}

/**
 * returns trues if a snippet file is linked
 * @param filepath filepath of the snippet
 * @param strict true if linked to any profile
 */
export async function isSnippetLinked(filepath: string, strict?: boolean): Promise<boolean> {
	if (!isUserSnippet(filepath)) {
		return false; // Only user snippets can be linked
	}
	const linkedSnippets = await getLinkedSnippets();
	const basename = path.basename(filepath);
	return (
		basename in linkedSnippets &&
		(strict || linkedSnippets[basename].includes((await getActiveProfile()).location))
	);
}

const isUserSnippet = (filepath: string) => isParentDir(getUserPath(), filepath);
