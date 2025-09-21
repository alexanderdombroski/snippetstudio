import type { TreeItem, TreeDataProvider, Event, EventEmitter } from 'vscode';
import vscode from '../vscode';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import {
	snippetLocationDropdownTemplates,
	type SnippetCategoryTreeItem,
	snippetLocationTemplate,
	extensionTreeItems,
} from './templates';
import { findAllExtensionSnippetsFiles } from '../snippets/extension/locate';
import { getLinkedSnippets } from '../snippets/links/config';
import path from 'node:path';
import { getActiveProfile } from '../utils/profile';

/** Tree View to display all snippet files and locations */
export default class LocationTreeProvider implements TreeDataProvider<TreeItem> {
	private profileDropdowns: SnippetCategoryTreeItem[] = [];
	private localTreeItems: TreeItem[] = [];
	private globalTreeItems: TreeItem[] = [];
	private extensionTreeItems: [TreeItem, TreeItem[]][] = [];
	private profileDropdownItems: { [location: string]: TreeItem[] } = {};
	private debounceTimer: NodeJS.Timeout | undefined;

	// ---------- Constructor ---------- //

	constructor() {
		this.__refresh();
	}

	// ---------- __Refresh Methods ---------- //

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
		const extensionSnippetFilesMap = await findAllExtensionSnippetsFiles();
		this.extensionTreeItems = extensionTreeItems(extensionSnippetFilesMap);
		this._onDidChangeTreeData.fire();
	}

	/** ensures a refresh doesn't happen too often */
	public debounceRefresh() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer); // Clear previous timer
		}
		this.debounceTimer = setTimeout(async () => {
			await this.__refresh(); // Call __refresh after delay
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

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> =
		new vscode.EventEmitter<TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
