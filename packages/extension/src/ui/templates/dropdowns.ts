import type { TreeItemCollapsibleState } from 'vscode';
import { getCurrentLanguage } from '../../utils/language';
import { Collapsed, Expanded, None, ThemeIcon, TreeItem } from '../../vscode';
import type { ProfileInfo } from '../../types';
import { getPathFromProfileLocation } from '../../utils/profile';

/** Dropdown for a VS Code language */
export class LanguageDropdown extends TreeItem {
	constructor(lang: string, expanded: boolean) {
		super(lang.toUpperCase(), expanded ? Expanded : Collapsed);
		this.iconPath = new ThemeIcon('code');
		this.tooltip = 'The language of the open file';
		this.contextValue = 'active-snippets';
	}
}

/** Generic Class for categories of snippet files */
export class SnippetCategoryDropdown extends TreeItem {
	constructor(
		label: string,
		collapsibleState: TreeItemCollapsibleState,
		icon: string,
		readonly folderPath: string
	) {
		super(label, collapsibleState);
		this.iconPath = new ThemeIcon(icon);
	}
}

/** Dropdown for the actively open language */
export class ActiveLanguageDropdown extends SnippetCategoryDropdown {
	constructor(collapsible: boolean) {
		const lang = getCurrentLanguage();
		super(lang ?? 'No Language Open', collapsible ? Expanded : None, 'code', '');
		this.tooltip = 'The language of the open file';
		this.contextValue = 'active-snippets';
	}
}

/** Dropdown for other vscode profiles. */
export class UnloadedDropdown extends SnippetCategoryDropdown {
	constructor() {
		super('Other Profiles', Collapsed, 'organization', '');
		this.contextValue = 'disabled-dropdown';
		this.tooltip = "Snippets in these files won't be expandable until you switch your profile";
	}
}

/** Dropdown for Snippets of the Active Profile */
export class GlobalSnippetsDropdown extends SnippetCategoryDropdown {
	constructor(folderPath: string, collapsible: boolean) {
		super('Global Snippets', collapsible ? Collapsed : None, 'globe', folderPath);
		this.contextValue = 'global-dropdown category-dropdown';
		this.tooltip = 'Global Snippets are available anywhere in vscode';
	}
}

/** Dropdown for Snippets of the open workspace */
export class LocalSnippetsDropdown extends SnippetCategoryDropdown {
	constructor(folderPath: string, collapsible: boolean) {
		super('Local Snippets', collapsible ? Collapsed : None, 'folder', folderPath);
		this.contextValue = 'local-dropdown category-dropdown';
		this.tooltip = 'Local Snippets are only loaded while open to this folder.';
	}
}

/** Dropdown for all profiles */
export class AllProfilesDropdown extends SnippetCategoryDropdown {
	constructor() {
		super('Profiles Snippets', Collapsed, 'organization', '');
		this.tooltip =
			'Read [VS Code Profile Documentation](https://code.visualstudio.com/docs/configure/profiles) to learn more about profiles!';
	}
}

/** Dropdown for all Extensions */
export class AllExtensionDropdown extends SnippetCategoryDropdown {
	constructor() {
		super('Extension Snippets', Collapsed, 'extensions', '');
		this.tooltip = 'Snippets that come packaged with extensions.';
	}
}

/** Dropdown for a single extension */
export class ExtensionDropdown extends TreeItem {
	constructor(
		readonly indentifer: string,
		readonly name: string
	) {
		super(name, Collapsed);
		this.description = indentifer;
		this.contextValue = 'extension-dropdown';
	}
}

/** Dropdown for snippets of a single profile */
export class ProfileDropdown extends SnippetCategoryDropdown {
	constructor(
		readonly profile: ProfileInfo,
		collapsible: boolean
	) {
		super(
			profile.name,
			collapsible ? Collapsed : None,
			profile.icon ?? 'account',
			getPathFromProfileLocation(profile.location)
		);
		this.description = profile.location;
		this.contextValue = 'profile-dropdown category-dropdown';
	}
}
