import type { TreeItem, TreeDataProvider, Event, EventEmitter } from 'vscode';
import vscode, { getConfiguration } from '../vscode';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import {
	snippetLocationDropdownTemplates,
	type SnippetCategoryTreeItem,
	snippetLocationTemplate,
	extensionTreeItems,
	createTreeItemFromSnippet,
	type TreePathItem,
} from './templates';
import { getLinkedSnippets } from '../snippets/links/config';
import path from 'node:path';
import { getActiveProfile } from '../utils/profile';
import { readJsoncFilesAsync } from '../utils/jsoncFilesIO';

/** Tree View to display all snippet files and locations */
export default class LocationTreeProvider implements TreeDataProvider<TreeItem> {
	private profileDropdowns: SnippetCategoryTreeItem[] = [];
	private localTreeItems: TreeItem[] = [];
	private globalTreeItems: TreeItem[] = [];
	private extensionTreeItems: [TreeItem, TreeItem[]][] = [];
	private profileDropdownItems: { [location: string]: TreeItem[] } = {};
	private trackedFiles = new Set<string>();
	private trackedSnippets: { [location: string]: TreeItem[] } = {};
	private debounceTimer: NodeJS.Timeout | undefined;

	// ---------- Constructor ---------- //

	constructor() {
		this._refresh();
	}

	// ---------- Refresh Methods ---------- //

	/** finds all snippet files and redisplays them */
	async _refresh() {
		const [locals, globals, profiles] = await locateAllSnippetFiles();
		this.localTreeItems = locals.map((fp) =>
			snippetLocationTemplate(fp, 'snippet-filepath', this.trackedFiles.has(fp))
		);
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
					: 'snippet-filepath global',
				this.trackedFiles.has(fp)
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
								: 'snippet-filepath profile',
							this.trackedFiles.has(fp)
						)
					),
				];
			})
		);
		await this.loadTrackSnippets();
		if (getConfiguration('snippetstudio').get<boolean>('view.showExtensions')) {
			const { findAllExtensionSnippetsFiles } = await import('../snippets/extension/locate.js');
			const extensionSnippetFilesMap = await findAllExtensionSnippetsFiles();
			this.extensionTreeItems = extensionTreeItems(extensionSnippetFilesMap);
		}
		this._onDidChangeTreeData.fire();
	}

	/** Updates tracked Snippets to include snippets from tracked files */
	private async loadTrackSnippets() {
		const snippetsFilesMap = await readJsoncFilesAsync(Array.from(this.trackedFiles));
		this.trackedSnippets = Object.fromEntries(
			snippetsFilesMap.map(([fp, snippets]) => {
				const snippetItems = Object.entries(snippets).map(([title, snippet]) =>
					createTreeItemFromSnippet(title, snippet, fp)
				);
				return [fp, snippetItems];
			})
		);
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
		if (this.localTreeItems.length === 0 && this.globalTreeItems.length === 0) {
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
				return this.extensionTreeItems.map((item) => item[0]);
			} else if (element.contextValue === 'extension-dropdown') {
				return (
					this.extensionTreeItems.find(([fp]) => fp.description === element.description)?.[1] ?? []
				);
			} else if (element.contextValue?.includes('category-dropdown')) {
				return this.profileDropdownItems[element.description as string];
			}

			const path = (element as TreePathItem).path as string;
			if (this.trackedFiles.has(path)) {
				return this.trackedSnippets[path];
			}
			return [];
		}

		const [topLevelDropdowns, profileDropdowns] = await snippetLocationDropdownTemplates(
			this.globalTreeItems.length === 0,
			this.localTreeItems.length === 0,
			this.extensionTreeItems.length > 0,
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

	/** Load Snippets in the location view */
	async trackFile(filepath: string) {
		this.trackedFiles.add(filepath);
		this._refresh();
	}

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> =
		new vscode.EventEmitter<TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
