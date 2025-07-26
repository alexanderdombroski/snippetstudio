import * as vscode from 'vscode';
import loadSnippets from '../snippets/loadSnippets';
import {
	unloadedDropdownTemplate,
	selectedLanguageTemplate,
	extensionCategoryDropdown,
	extensionSnippetsTreeItems,
} from './templates';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfileSnippetsDir } from '../utils/profile';
import { getWorkspaceFolder, shortenFullPath } from '../utils/fsInfo';
import path from 'path';
import { findAllExtensionSnipppetsByLang } from '../snippets/extension';
import { group } from 'console';

type ParentChildTreeItems = [vscode.TreeItem, vscode.TreeItem[]][];

export default class SnippetViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	// ---------- Attributes ---------- //
	private snippetTreeItems: ParentChildTreeItems | undefined;
	private extensionDropdownsTuple: [vscode.TreeItem, ParentChildTreeItems][] | undefined;
	private langId: string | undefined;
	private debounceTimer: NodeJS.Timeout | undefined;
	private _activePaths: string[] = [];

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
			shortenFullPath(path.join(getWorkspaceFolder() ?? 'not found', 'snippets')),
		];
	}
	private async refresh() {
		this.snippetTreeItems = await loadSnippets();
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
			if (element.contextValue === 'disabled-dropdown') {
				return this.snippetTreeItems?.map((group) => group[0]).filter((fp) => !this.isActive(fp));
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

		// Root level: Load snippet files and create parent items
		if (!this.snippetTreeItems) {
			this.snippetTreeItems = await loadSnippets();
		}

		const rootItems: vscode.TreeItem[] = [selectedLanguageTemplate(this.langId)]; // Always add the template

		if (this.snippetTreeItems && this.snippetTreeItems.length > 0) {
			// Add the snippet groups if they exist
			const fileItems = this.snippetTreeItems.map((group) => group[0]);
			const activeDropdowns = fileItems.filter(this.isActive);
			rootItems.push(...activeDropdowns);
			this.extensionDropdownsTuple?.length && rootItems.push(extensionCategoryDropdown());
			fileItems.length !== activeDropdowns.length && rootItems.push(unloadedDropdownTemplate());
		}

		return rootItems;
	}

	private findExtensionSnippetsByElement(element: vscode.TreeItem): vscode.TreeItem[] | undefined {
		if (this.extensionDropdownsTuple) {
			for (let [_, fileDropdowns] of this.extensionDropdownsTuple) {
				for (let [fileDropdown, snippets] of fileDropdowns) {
					if (fileDropdown.description === element.description) {
						return snippets;
					}
				}
			}
		}
	}

	private isActive = (fileItem: vscode.TreeItem) =>
		this._activePaths.includes(path.dirname(String(fileItem.description)));

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
		new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
