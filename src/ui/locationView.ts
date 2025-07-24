import * as vscode from 'vscode';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import {
	snippetLocationDropdownTemplates,
	type SnippetCategoryTreeItem,
	snippetLocationTemplate,
	extensionTreeItems,
} from './templates';
import { findAllExtensionSnippetsFiles } from '../snippets/extension';

export default class LocationTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private profileDropdowns: SnippetCategoryTreeItem[] = [];
	private localTreeItems: vscode.TreeItem[] = [];
	private globalTreeItems: vscode.TreeItem[] = [];
	private extensionTreeItems: [vscode.TreeItem, vscode.TreeItem[]][] = [];
	private profileDropdownItems: { [location: string]: vscode.TreeItem[] } = {};
	private debounceTimer: NodeJS.Timeout | undefined;

	// ---------- Constructor ---------- //
	constructor() {
		this.refresh();
	}

	// ---------- Refresh Methods ---------- //
	private async refresh() {
		const [locals, globals, profiles] = await locateAllSnippetFiles();
		this.localTreeItems = locals.map((p) => snippetLocationTemplate(p));
		this.globalTreeItems = globals.map((p) => snippetLocationTemplate(p));
		this.profileDropdownItems = Object.fromEntries(
			Object.entries(profiles).map(([location, paths]) => {
				return [location, paths.map((fp) => snippetLocationTemplate(fp))];
			})
		);
		const extensionSnippetFilesMap = await findAllExtensionSnippetsFiles();
		this.extensionTreeItems = extensionTreeItems(extensionSnippetFilesMap);
		this._onDidChangeTreeData.fire();
	}
	public debounceRefresh() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer); // Clear previous timer
		}
		this.debounceTimer = setTimeout(async () => {
			await this.refresh(); // Call refresh after delay
			this.debounceTimer = undefined; // Clear timer
		}, 400); // Adjust delay as needed (e.g., 200ms)
	}

	// ---------- INIT TREE Methods ---------- //
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return element;
	}
	async getChildren(
		element?: vscode.TreeItem | undefined
	): Promise<vscode.TreeItem[] | null | undefined> {
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
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> =
		new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
