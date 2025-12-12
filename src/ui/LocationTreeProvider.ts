import type {
	TreeItem,
	TreeDataProvider,
	Event,
	EventEmitter,
	ExtensionContext,
	TreeItemCollapsibleState,
} from 'vscode';
import vscode, { Collapsed, None, registerCommand } from '../vscode';
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
import {
	getActiveProfile,
	getActiveProfileSnippetsDir,
	getPathFromProfileLocation,
	getProfiles,
} from '../utils/profile';
import { getCacheManager } from '../snippets/SnippetCacheManager';
import { getWorkspaceFolder } from '../utils/fsInfo';
import type { VSCodeSnippets } from '../types';

/** Tree View to display all snippet files and locations */
export default class LocationTreeProvider implements TreeDataProvider<TreeItem> {
	private debounceTimer: NodeJS.Timeout | undefined;

	// ---------- Constructor ---------- //

	constructor(context: ExtensionContext) {
		context.subscriptions.push(
			registerCommand('snippetstudio.refreshLocations', this.debounceRefresh.bind(this))
		);

		getCacheManager()
			.updateActiveFiles()
			.then(() => this._onDidChangeTreeData.fire());
	}

	// ---------- Refresh Methods ---------- //

	/** finds all snippet files and redisplays them */
	async _refresh() {
		const cache = getCacheManager();
		await Promise.all([
			cache.updateActiveFiles(),
			cache.updateExtensionFiles(),
			cache.updateProfileFiles(),
			cache.hardRefresh(),
		]);

		this._onDidChangeTreeData.fire();
	}

	/** ensures a refresh doesn't happen too often */
	public debounceRefresh() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer); // Clear previous timer
		}
		this.debounceTimer = setTimeout(async () => {
			await this._refresh(); // Call _refresh after delay
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

		// Top Level
		if (!element) {
			const topLevelDropdowns: TreeItem[] = [];
			topLevelDropdowns.push(
				new GlobalSnippetsDropdown(
					await getActiveProfileSnippetsDir(),
					Boolean(cache.globals.length)
				),
				new LocalSnippetsDropdown(
					path.join(getWorkspaceFolder() as string, '.vscode'),
					Boolean(cache.locals.length)
				)
			);
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
				const contextValue = this.isSnippetLinked(base, profile.location)
					? 'snippet-filepath global linked'
					: 'snippet-filepath global';
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
					'snippet-filepath'
				);
			});
		}

		if (element.label === 'Extension Snippets') {
			await cache.updateExtensionFiles();
			return Object.entries(cache.extension).map(
				([extension, { name }]) => new ExtensionDropdown(extension, name)
			);
		}

		if (element.contextValue === 'extension-dropdown') {
			const files = cache.extension[element.description as string].files;
			const paths = Array.from(new Set(files.map(({ path }) => path)));
			return paths.map((file) => {
				const snippets = cache.snippets.get(file);
				return new SnippetFileTreeItem(
					this.getCollapsibleState(snippets),
					file,
					'extension-snippet-filepath'
				);
			});
		}

		if (element.label === 'Profiles Snippets') {
			const profiles = await getProfiles();
			await cache.updateProfileFiles();
			return profiles.map(
				(profile) => new ProfileDropdown(profile, Boolean(cache.profile[profile.location].length))
			);
		}

		if (element.contextValue?.includes('profile-dropdown')) {
			const location = element.description as string;
			const files = cache.profile[location];
			const dir = getPathFromProfileLocation(location);
			const contextValue = this.isSnippetLinked(dir, location)
				? 'snippet-filepath profile linked'
				: 'snippet-filepath profile';
			return files.map((file) => {
				const snippets = cache.snippets.get(file);
				return new SnippetFileTreeItem(this.getCollapsibleState(snippets), file, contextValue);
			});
		}

		// Snippets
		if (element.contextValue?.includes('snippet-filepath')) {
			const filepath = (element as SnippetFileTreeItem).filepath;
			const isExtensionSnippet = element.contextValue === 'extension-snippet-filepath';
			const contextValue = isExtensionSnippet ? 'extension-snippet' : 'snippet';
			const snippets = await cache.getSnippets(filepath, { isExtensionSnippet, showError: true });
			if (snippets) {
				return Object.entries(snippets).map(
					([title, snippet]) => new SnippetTreeItem(title, snippet, filepath, contextValue)
				);
			}
		}

		return [];
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
