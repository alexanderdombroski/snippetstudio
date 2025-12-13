import type { TreeItem, TreeDataProvider, Event, EventEmitter } from 'vscode';
import vscode, { Collapsed, getConfiguration, None, onDidChangeActiveTextEditor } from '../vscode';
import { getCurrentLanguage } from '../utils/language';
import path from 'node:path';
import { LanguageDropdown, SnippetFileTreeItem, SnippetTreeItem } from './templates';
import { getCacheManager } from '../snippets/SnippetCacheManager';

let provider: SnippetViewProvider;

/** Returns the singleton cache manager */
export function getSnippetViewProvider(): SnippetViewProvider {
	provider ??= new SnippetViewProvider();
	return provider;
}

/** Creates a tree view to display all snippets of the active language */
export default class SnippetViewProvider implements TreeDataProvider<TreeItem> {
	private langId: string | undefined;

	// ---------- Constructor ---------- //

	/** inits snippet view and refreshing */
	constructor() {
		this.refresh();

		onDidChangeActiveTextEditor(async () => {
			const newLangId = getCurrentLanguage();
			if (newLangId && this.langId !== newLangId) {
				this.langId = newLangId;
				this.debounceRefresh();
			}
		});
	}

	// ---------- Refresh Methods ---------- //

	private debounceTimer: NodeJS.Timeout | undefined;

	/** reread and format all snippet files */
	private async refresh() {
		this.langId = getCurrentLanguage();
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
		if (!this.langId) return;

		if (!element) {
			return [new LanguageDropdown(this.langId)];
		}

		const cache = getCacheManager();
		if (element.contextValue === 'active-snippets') {
			const snippetGroups = await cache.getLangSnippets();
			const links = cache.links;

			const items = snippetGroups.map(([file, snippets]) => {
				const collapsible = Object.entries(snippets).some(
					([, v]) => !v.scope || v.scope.includes(this.langId as string)
				);
				const contextValue =
					path.basename(file) in links ? 'snippet-filepath linked' : 'snippet-filepath';
				return new SnippetFileTreeItem(collapsible ? Collapsed : None, file, contextValue);
			});

			if (getConfiguration('snippetstudio').get<boolean>('alwaysShowProjectSnippetFiles')) {
				return items;
			}

			return items.filter(
				(item) => String(item.label).endsWith('json') || item.collapsibleState !== None
			);
		}

		if (element.contextValue?.includes('snippet-filepath')) {
			const filepath = (element as SnippetFileTreeItem).filepath;
			const snippets = await cache.getSnippets(filepath, { showError: true });
			if (snippets) {
				let pairs = Object.entries(snippets);
				if (filepath.endsWith('code-snippets')) {
					pairs = pairs.filter(([, { scope }]) => !scope || scope.includes(this.langId as string));
				}

				return pairs.map(([title, snippet]) => new SnippetTreeItem(title, snippet, filepath));
			}
		}

		return [];
	}

	// ---------- Event Emitters ---------- //
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> =
		new vscode.EventEmitter<TreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;
}
