import type { TreeItemCollapsibleState, TreeItem as TreeItemType } from 'vscode';
import { None, Collapsed, Expanded, TreeItem, ThemeIcon } from '../vscode';
import path from 'node:path';
import type {
	VSCodeSnippet,
	ExtensionSnippetFilesMap,
	SnippetContribution,
	ExtensionSnippetsMap,
} from '../types';
import { getWorkspaceFolder, shortenFullPath } from '../utils/fsInfo';
import {
	getActiveProfile,
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getProfiles,
} from '../utils/profile';

export class TreePathItem extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly path: string
	) {
		super(label, collapsibleState);
	}
}
export class SnippetCategoryTreeItem extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly folderPath: string,
		public readonly location: string
	) {
		super(label, collapsibleState);
	}
}

/**
 * Creates a TreeItem from a VSCodeSnippet.
 *
 * @param snippetTitle The title of the snippet.
 * @param snippet The VSCodeSnippet object.
 * @returns A TreeItem representing the snippet.
 */
export function createTreeItemFromSnippet(
	snippetTitle: string,
	snippet: VSCodeSnippet,
	path: string,
	contextValue: string = 'snippet'
): TreePathItem {
	const prefix = Array.isArray(snippet.prefix) ? snippet.prefix.join(',') : snippet.prefix;
	const treeItem = new TreePathItem(prefix, None, path);

	treeItem.description = snippetTitle;
	treeItem.contextValue = contextValue;

	const body: string = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
	treeItem.tooltip = `Keyword: ${snippet.prefix}\n${body}${snippet.description ? '\n\n' + snippet.description : ''}`;

	// Command to show the snippet body when clicked
	treeItem.command = {
		title: 'Show Snippet Body',
		command: 'snippetstudio.snippet.showBody',
		arguments: [treeItem],
	};

	return treeItem;
}

export function createTreeItemFromFilePath(
	filepath: string,
	collapsibleState: TreeItemCollapsibleState,
	contextValue: string = 'snippet-filepath'
): TreePathItem {
	const filename = path.basename(filepath);
	const treeItem = new TreePathItem(filename, collapsibleState, filepath);
	treeItem.description = shortenFullPath(filepath);
	treeItem.tooltip =
		'Snippets from this dropdown are found in ' + filepath + '\n\nRight Click to open the file!';
	treeItem.contextValue = contextValue;

	return treeItem;
}

export function selectedLanguageTemplate(
	langId: string | undefined,
	collapsible: boolean
): TreeItemType {
	const treeItem = new TreeItem(
		langId === undefined ? 'No Language Open' : `${langId}`.toUpperCase(),
		collapsible ? Expanded : None
	);
	treeItem.tooltip = 'The language of the open file';
	treeItem.contextValue = 'active-snippets';
	treeItem.iconPath = new ThemeIcon('code');
	return treeItem;
}

export function unloadedDropdownTemplate(): TreeItemType {
	const unloadedDropdown = new TreeItem('Other Profiles', Collapsed);
	unloadedDropdown.contextValue = 'disabled-dropdown';
	unloadedDropdown.tooltip =
		"Snippets in these files won't be expandable until you switch your profile";
	unloadedDropdown.iconPath = new ThemeIcon('organization');
	return unloadedDropdown;
}

export function snippetLocationTemplate(
	filepath: string,
	contextValue: string = 'snippet-filepath',
	collapsible?: boolean
): TreePathItem {
	const treeItem = new TreePathItem(
		path.basename(filepath),
		collapsible ? Collapsed : None,
		filepath
	);
	treeItem.description = shortenFullPath(filepath);
	treeItem.tooltip = 'Double click to open the file: ' + filepath;
	treeItem.contextValue = contextValue;
	if (treeItem.contextValue.includes('linked')) {
		treeItem.iconPath = new ThemeIcon('link');
	}

	// Command to open Snippet file when double clicked
	treeItem.command = {
		title: 'Open Snippet File',
		command: 'snippetstudio.file.openFromDouble',
		arguments: [treeItem],
	};

	return treeItem;
}

// ---------- Extension Dropdowns ----------

export function extensionCategoryDropdown() {
	const dropdown = new TreeItem('Extension Snippets', Collapsed);
	dropdown.tooltip = 'Snippets that come packaged with extensions.';
	dropdown.iconPath = new ThemeIcon('extensions');
	return dropdown;
}
function extensionDropdown(indentifer: string, name: string): TreeItemType {
	const treeItem = new TreeItem(name, Collapsed);
	treeItem.description = indentifer;
	treeItem.contextValue = 'extension-dropdown';
	return treeItem;
}
function extensionSnippetsDropdown(
	contribution: SnippetContribution,
	collapsible?: boolean
): TreePathItem {
	const item = snippetLocationTemplate(contribution.path, 'extension-snippet-path', collapsible);
	item.tooltip = `Extension Snippet file for ${contribution.language}. Edits will be overridden next extension update.`;
	return item;
}

type DropdownWithItems = [TreeItemType, TreePathItem[]];
export function extensionTreeItems(fileMap: ExtensionSnippetFilesMap): DropdownWithItems[] {
	return Object.entries(fileMap).map(([identifier, ext]): DropdownWithItems => {
		const dropdown = extensionDropdown(identifier, ext.name);
		const fileItems = ext.files.map((contribution) => extensionSnippetsDropdown(contribution));

		return [dropdown, fileItems];
	});
}

type DropdownWithFileItems = [TreePathItem, TreePathItem[]];
type DropdownWithDropdowns = [TreeItemType, DropdownWithFileItems[]];
export function extensionSnippetsTreeItems(
	snippetsMap: ExtensionSnippetsMap
): DropdownWithDropdowns[] {
	return Object.entries(snippetsMap).map(
		([identifier, { name, snippets }]): DropdownWithDropdowns => {
			const extDropdown = extensionDropdown(identifier, name);
			const fileDropdowns = snippets.map((contributes): DropdownWithFileItems => {
				const snippetItems = Object.entries(contributes.snippets).map(([title, snippet]) =>
					createTreeItemFromSnippet(title, snippet, contributes.path, 'extension-snippet')
				);

				return [extensionSnippetsDropdown(contributes, true), snippetItems];
			});

			return [extDropdown, fileDropdowns];
		}
	);
}

// ---------- Dropdowns for Snippet Location View ----------

/**
 * returns [top level dropdowns, profile dropdowns]
 */
export async function snippetLocationDropdownTemplates(
	global_collapsed: boolean,
	local_collapsed: boolean,
	extension_showing: boolean,
	profile_collapsed_map: { [location: string]: boolean }
): Promise<[SnippetCategoryTreeItem[] | TreeItemType[], SnippetCategoryTreeItem[]]> {
	const activePath = await getActiveProfileSnippetsDir();
	const activeProfile = await getActiveProfile();
	const getCollapsedState = (collapsed: boolean) => (collapsed ? None : Collapsed);

	// ------------------------- Global Dropdown -------------------------
	const global = new SnippetCategoryTreeItem(
		'Global Snippets',
		getCollapsedState(global_collapsed),
		activePath,
		activeProfile.location
	);
	global.contextValue = 'global-dropdown category-dropdown';
	global.tooltip = 'Global Snippets are availiable anywhere in vscode';
	global.iconPath = new ThemeIcon('globe');

	const topLevelDropdowns: TreeItemType[] = [global];

	// ------------------------- Local Dropdown -------------------------
	const workspaceFolder = getWorkspaceFolder();
	if (workspaceFolder) {
		const local = new SnippetCategoryTreeItem(
			'Local Snippets',
			getCollapsedState(local_collapsed),
			path.join(workspaceFolder, '.vscode'),
			''
		);
		local.contextValue = 'local-dropdown category-dropdown';
		local.tooltip = 'Local Snippets are only loaded while open to this folder.';
		local.iconPath = new ThemeIcon('folder');
		topLevelDropdowns.push(local);
	}

	// ------------------------- Extension Dropdown -------------------------
	if (extension_showing) {
		const extensionDropdown = extensionCategoryDropdown();
		topLevelDropdowns.push(extensionDropdown);
	}

	// ------------------------- Profile Dropdown -------------------------
	const profiles = await getProfiles();
	if (profiles.length < 2) {
		return [topLevelDropdowns, []];
	}

	const profileDropdowns = profiles.map((profile) => {
		const item = new SnippetCategoryTreeItem(
			`${profile.name}`,
			getCollapsedState(profile_collapsed_map[profile.location]),
			getPathFromProfileLocation(profile.location),
			profile.location
		);
		item.iconPath = new ThemeIcon(profile.icon ?? 'account');
		return item;
	});
	profileDropdowns.forEach((pd) => {
		pd.contextValue = 'profile-dropdown category-dropdown';
		pd.description = shortenFullPath(pd.location);
	});
	const otherProfilesDropdown = new TreeItem('Profiles Snippets', Collapsed);
	otherProfilesDropdown.tooltip =
		'Read [VS Code Profile Documentation](https://code.visualstudio.com/docs/configure/profiles) to learn more about profiles!';
	otherProfilesDropdown.contextValue = 'profile-dropdown';
	otherProfilesDropdown.iconPath = new ThemeIcon('organization');
	topLevelDropdowns.push(otherProfilesDropdown);

	return [topLevelDropdowns, profileDropdowns];
}
