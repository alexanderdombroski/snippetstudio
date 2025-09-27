import type { TreeItem, TreeDataProvider, Event, EventEmitter } from 'vscode';
import vscode, { getConfiguration, onDidChangeActiveTextEditor } from '../vscode';
import loadSnippets from '../snippets/loadSnippets';
import {
	unloadedDropdownTemplate,
	selectedLanguageTemplate,
	extensionCategoryDropdown,
	extensionSnippetsTreeItems,
} from './templates';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfile, getActiveProfileSnippetsDir } from '../utils/profile';
import { getWorkspaceFolder, isParentDir, shortenFullPath } from '../utils/fsInfo';
import path from 'node:path';
import { getLinkedSnippets } from '../snippets/links/config';
import { getUserPath } from '../utils/context';
import type { SnippetLinks } from '../types';

type ParentChildTreeItems = [TreeItem, TreeItem[]][];

/** Creates a tree view to display all snippets of the active language */
export default class SnippetViewProvider implements TreeDataProvider<TreeItem> {
	// ---------- Attributes ---------- //
	private snippetTreeItems: ParentChildTreeItems | undefined;
	private activeDropdowns: TreeItem[] | undefined;
	private extensionDropdownsTuple: [TreeItem, ParentChildTreeItems][] | undefined;
	private langId: string | undefined;
	private debounceTimer: NodeJS.Timeout | undefined;
	private _activePaths: string[] = [];
	private _activeProfileLocation: string = '';
	private _links: SnippetLinks = {};
	private _userPath = getUserPath();

	// ---------- Constructor ---------- //

	/** inits snippet view and refreshing */
	constructor() {
		this.langId = getCurrentLanguage();
		(async () => {
			this._activePaths = [
				shortenFullPath(await getActiveProfileSnippetsDir()),
				shortenFullPath(path.join(getWorkspaceFolder() ?? 'not found', '.vscode')),
			];
		})().then(() => {
			this.refresh();
		});

		onDidChangeActiveTextEditor(async () => {
			const newLangId = getCurrentLanguage();
			if (newLangId && this.langId !== newLangId) {
				this.langId = newLangId;
				this.debounceRefresh();
			}
		});
	}

	// ---------- Refresh Methods ---------- //

	/** reread and format all snippet files */
	private async refresh() {
		this._links = await getLinkedSnippets();
		this._activeProfileLocation = (await getActiveProfile()).location;
		this.snippetTreeItems = await loadSnippets();
		this.activeDropdowns = this.snippetTreeItems?.map((group) => group[0])?.filter(this.isActive);
		if (this.langId && getConfiguration('snippetstudio').get<boolean>('view.showExtensions')) {
			const { findAllExtensionSnipppetsByLang } = await import('../snippets/extension/locate.js');
			const extensionSnippetsMap = await findAllExtensionSnipppetsByLang(this.langId);
			this.extensionDropdownsTuple = extensionSnippetsTreeItems(extensionSnippetsMap);
		} else {
			this.extensionDropdownsTuple = undefined;
		}
		this._onDidChangeTreeData.fire();
	}

	/** applies debounce to refresh */
	public debounceRefresh() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer); // Clear previous timer
		}
		this.debounceTimer = setTimeout(async () => {
			await this.refresh(); // Call refresh after delay
			this.debounceTimer = undefined; // Clear timer
		}, 300); // Adjust delay as needed (e.g., 200ms)
	}

	// ---------- INIT TREE Methods ---------- //

	/** returns a tree item */
	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	/** loads the tree items recursively in groups */
	async getChildren(element?: TreeItem): Promise<TreeItem[] | undefined> {
		// Handle child items
		if (element) {
			if (element.contextValue === 'active-snippets') {
				return this.activeDropdowns;
			}

			if (element.contextValue === 'disabled-dropdown') {
				return this.snippetTreeItems
					?.map((group) => group[0])
					.filter((fp) => !this.isActive(fp) && this.isNotLinkedActive(fp))
					.reduce((acc: TreeItem[], curr) => {
						if (
							curr.contextValue?.includes('linked') &&
							acc.some((item) => item.label === curr.label && item.contextValue?.includes('linked'))
						) {
							return acc;
						}
						acc.push(curr);
						return acc;
					}, []);
			}

			if (element.label === 'Extension Snippets') {
				return this.extensionDropdownsTuple?.map((group) => group[0]);
			}

			if (element.contextValue === 'extension-dropdown') {
				const match = this.extensionDropdownsTuple?.find(
					([extDropdown]) => element.description === extDropdown.description
				);
				return match?.[1].map((group) => group[0]);
			}

			if (element.contextValue === 'extension-snippet-path') {
				return this.extensionDropdownsTuple
					?.flatMap(([, fileDropdowns]) => fileDropdowns)
					.find(([fileDropdown]) => fileDropdown.description === element.description)?.[1];
			}

			const parentChild = this.snippetTreeItems?.find(
				(group) => group[0].description === element.description
			);
			return parentChild ? parentChild[1] : undefined;
		}

		// Root level: Create parent items
		const rootItems: TreeItem[] = [
			selectedLanguageTemplate(this.langId, !!this.activeDropdowns?.length),
		]; // Always add the template
		this.extensionDropdownsTuple?.length && rootItems.push(extensionCategoryDropdown());
		this.snippetTreeItems
			?.map((group) => group[0])
			?.filter((d) => this.isNotLinkedActive(d) && this.isNotLocal(d) && !this.isActive(d))
			?.length && rootItems.push(unloadedDropdownTemplate());

		return rootItems;
	}

	private isActive = (fileItem: TreeItem) =>
		this._activePaths.includes(path.dirname(String(fileItem.description)));
	private isNotLinkedActive = (fileItem: TreeItem) =>
		!(
			(fileItem.label as string) in this._links &&
			this._links[fileItem.label as string].includes(this._activeProfileLocation)
		);
	private isNotLocal = (fileItem: TreeItem) =>
		!isParentDir(this._userPath, String(fileItem.description));

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> =
		new vscode.EventEmitter<TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
