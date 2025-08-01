import * as vscode from 'vscode';
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
import path from 'path';
import { findAllExtensionSnipppetsByLang } from '../snippets/extension';
import { getLinkedSnippets } from '../snippets/links';
import { getUserPath } from '../utils/context';
import type { SnippetLinks } from '../types';

type ParentChildTreeItems = [vscode.TreeItem, vscode.TreeItem[]][];

export default class SnippetViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	// ---------- Attributes ---------- //
	private snippetTreeItems: ParentChildTreeItems | undefined;
	private activeDropdowns: vscode.TreeItem[] | undefined;
	private extensionDropdownsTuple: [vscode.TreeItem, ParentChildTreeItems][] | undefined;
	private langId: string | undefined;
	private debounceTimer: NodeJS.Timeout | undefined;
	private _activePaths: string[] = [];
	private _activeProfileLocation: string = '';
	private _links: SnippetLinks = {};
	private _userPath = getUserPath();

	// ---------- Constructor ---------- //
	constructor() {
		this.langId = getCurrentLanguage();
		this.initPaths().then(() => {
			this.refresh();
		});

		vscode.window.onDidChangeActiveTextEditor(async () => {
			const newLangId = getCurrentLanguage();
			if (newLangId && this.langId !== newLangId) {
				this.langId = newLangId;
				this.debounceRefresh();
			}
		});
	}

	// ---------- Refresh Methods ---------- //
	private async initPaths() {
		this._activePaths = [
			shortenFullPath(await getActiveProfileSnippetsDir()),
			shortenFullPath(path.join(getWorkspaceFolder() ?? 'not found', '.vscode')),
		];
	}
	private async refresh() {
		this._links = await getLinkedSnippets();
		this._activeProfileLocation = (await getActiveProfile()).location;
		this.snippetTreeItems = await loadSnippets();
		this.activeDropdowns = this.snippetTreeItems?.map((group) => group[0])?.filter(this.isActive);
		if (this.langId) {
			const extensionSnippetsMap = await findAllExtensionSnipppetsByLang(this.langId);
			this.extensionDropdownsTuple = extensionSnippetsTreeItems(extensionSnippetsMap);
		} else {
			this.extensionDropdownsTuple = undefined;
		}
		this._onDidChangeTreeData.fire();
	}
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
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}

	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[] | undefined> {
		// Handle child items
		if (element) {
			if (element.contextValue === 'active-snippets') {
				return this.activeDropdowns;
			}

			if (element.contextValue === 'disabled-dropdown') {
				return this.snippetTreeItems
					?.map((group) => group[0])
					.filter((fp) => !this.isActive(fp) && this.isNotLinked(fp));
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
		const rootItems: vscode.TreeItem[] = [
			selectedLanguageTemplate(this.langId, !!this.activeDropdowns?.length),
		]; // Always add the template
		this.extensionDropdownsTuple?.length && rootItems.push(extensionCategoryDropdown());
		this.snippetTreeItems
			?.map((group) => group[0])
			?.filter((d) => this.isNotLinked(d) && this.isNotLocal(d) && !this.isActive(d))?.length &&
			rootItems.push(unloadedDropdownTemplate());

		return rootItems;
	}

	private isActive = (fileItem: vscode.TreeItem) =>
		this._activePaths.includes(path.dirname(String(fileItem.description)));
	private isNotLinked = (fileItem: vscode.TreeItem) =>
		!(
			(fileItem.label as string) in this._links &&
			this._links[fileItem.label as string].includes(this._activeProfileLocation)
		);
	private isNotLocal = (fileItem: vscode.TreeItem) =>
		!isParentDir(this._userPath, String(fileItem.description));

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
		new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
