import type {
	TreeItem,
	TreeDataProvider,
	Event,
	EventEmitter,
	TreeItemCollapsibleState,
} from 'vscode';
import vscode, { Collapsed, None } from '../vscode';
import {
	AllExtensionDropdown,
	AllProfilesDropdown,
	ExtensionDropdown,
	GlobalSnippetsDropdown,
	LocalSnippetsDropdown,
	ProfileDropdown,
	SnippetFileTreeItem,
	SnippetTreeItem,
} from './templates';
import path from 'node:path';
import { getActiveProfile, getActiveProfileSnippetsDir, getProfiles } from '../utils/profile';
import { getCacheManager } from '../snippets/SnippetCacheManager';
import { getWorkspaceFolder } from '../utils/fsInfo';
import type { VSCodeSnippets } from '../types';
import { getSnippetViewProvider } from './SnippetViewProvider';

let provider: LocationTreeProvider;

/** Returns the singleton cache manager */
export function getLocationTreeProvider(): LocationTreeProvider {
	provider ??= new LocationTreeProvider();
	return provider;
}

/** Tree View to display all snippet files and locations */
export default class LocationTreeProvider implements TreeDataProvider<TreeItem> {
	private debounceTimer: NodeJS.Timeout | undefined;

	// ---------- Constructor ---------- //

	constructor() {
		getCacheManager()
			.updateActiveFiles()
			.then(() => this._onDidChangeTreeData.fire());
	}

	// ---------- Refresh Methods ---------- //

	/** finds all snippet files and redisplays them */
	async __refresh() {
		const [locals, globals, profiles] = await locateAllSnippetFiles();
		this.localTreeItems = locals.map((p) => snippetLocationTemplate(p));
		const links = await getLinkedSnippets();
		const activeProfileLocation = (await getActiveProfile()).location;
		const snippetIsLinked = (fp: string, location: string) => {
			const base = path.basename(fp);
			return base in links && links[base].includes(location);
		};
		this.globalTreeItems = globals.map((fp) =>
			snippetLocationTemplate(
				fp,
				snippetIsLinked(fp, activeProfileLocation)
					? 'snippet-filepath global linked'
					: 'snippet-filepath global'
			)
		);
		this.profileDropdownItems = Object.fromEntries(
			Object.entries(profiles).map(([location, paths]) => {
				return [
					location,
					paths.map((fp) =>
						snippetLocationTemplate(
							fp,
							snippetIsLinked(fp, location)
								? 'snippet-filepath profile linked'
								: 'snippet-filepath profile'
						)
					),
				];
			})
		);
		this._onDidChangeTreeData.fire();
	}

	/** ensures a refresh doesn't happen too often */
	public debounceRefresh(hard?: boolean) {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer); // Clear previous timer
		}
		this.debounceTimer = setTimeout(async () => {
			await this._refresh(hard); // Call _refresh after delay
			this.debounceTimer = undefined; // Clear timer
		}, 400); // Adjust delay as needed (e.g., 200ms)
	}

	// ---------- INIT TREE Methods ---------- //

	/** returns a tree item */
	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	/** recursively returns snippet files in groups layered as shown in the tree view */
	async getChildren(element?: TreeItem | undefined): Promise<TreeItem[] | null | undefined> {
		const cache = getCacheManager();
		if (cache.snippets.size === 0) {
			return [];
		}

		if (element) {
			if (element.contextValue?.includes('global-dropdown')) {
				return this.globalTreeItems;
			} else if (element.contextValue?.includes('local-dropdown')) {
				return this.localTreeItems;
			} else if (element.contextValue === 'profile-dropdown') {
				return this.profileDropdowns;
			} else if (element.label === 'Extension Snippets') {
				if (this.extensionTreeItems.length === 0) {
					const { findAllExtensionSnippetsFiles } = await import('../snippets/extension/locate.js');
					const extensionSnippetFilesMap = await findAllExtensionSnippetsFiles();
					this.extensionTreeItems = extensionTreeItems(extensionSnippetFilesMap);
				}
				return this.extensionTreeItems.map((item) => item[0]);
			} else if (element.contextValue === 'extension-dropdown') {
				return (
					this.extensionTreeItems.find(([fp]) => fp.description === element.description)?.[1] ?? []
				);
			}
			topLevelDropdowns.push(new AllExtensionDropdown());
			if ((await getProfiles()).length > 1) {
				topLevelDropdowns.push(new AllProfilesDropdown());
			}

			return topLevelDropdowns;
		}

		// Dropdowns
		if (element.contextValue?.includes('global-dropdown')) {
			const profile = await getActiveProfile();
			return cache.globals.map((file) => {
				const base = path.basename(file);
				let contextValue = 'snippet-filepath global';
				if (base.endsWith('.code-snippets')) contextValue += ' mixed';
				if (this.isSnippetLinked(base, profile.location)) contextValue += ' linked';
				const snippets = cache.snippets.get(file);
				return new SnippetFileTreeItem(this.getCollapsibleState(snippets), file, contextValue);
			});
		}

		if (element.contextValue?.includes('local-dropdown')) {
			return cache.locals.map((file) => {
				const snippets = cache.snippets.get(file);
				return new SnippetFileTreeItem(
					this.getCollapsibleState(snippets),
					file,
					'snippet-filepath mixed'
				);
			});
		}

		const [topLevelDropdowns, profileDropdowns] = await snippetLocationDropdownTemplates(
			this.globalTreeItems.length === 0,
			this.localTreeItems.length === 0,
			Boolean(getConfiguration('snippetstudio').get<boolean>('view.showExtensions')),
			Object.fromEntries(
				Object.entries(this.profileDropdownItems).map(([location, items]) => [
					location,
					items.length === 0,
				])
			)
		);
		this.profileDropdowns = profileDropdowns;

		return topLevelDropdowns;
	}

	private getCollapsibleState = (
		snippets: VSCodeSnippets | null | undefined
	): TreeItemCollapsibleState =>
		snippets && Object.keys(snippets).length === 0 ? None : Collapsed;

	private isSnippetLinked = (basepath: string, location: string) =>
		basepath in getCacheManager().links && getCacheManager().links[basepath].includes(location);

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> =
		new vscode.EventEmitter<TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
