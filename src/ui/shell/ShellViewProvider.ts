import vscode from '../../vscode';
import type { Event, EventEmitter, TreeItem as TreeItemType, TreeDataProvider } from 'vscode';
import { getShellSnippets } from './config';
import { getDefaultShellProfile } from './utils';
import type { ShellSnippet } from '../../types';
import { ShellTreeItem, ShellTreeDropdown } from '../templates';

let shellViewProvider: ShellViewProvider;

/** Returns the singleton shell view provider class */
export function getShellView(): ShellViewProvider {
	if (!shellViewProvider) {
		shellViewProvider = new ShellViewProvider();
		vscode.window.createTreeView('shell-snippets', { treeDataProvider: shellViewProvider });
	}
	return shellViewProvider;
}

/** Tree View to display all shell snippets */
class ShellViewProvider implements TreeDataProvider<TreeItemType> {
	private _onDidChangeTreeData: EventEmitter<TreeItemType | null> =
		new vscode.EventEmitter<TreeItemType | null>();
	readonly onDidChangeTreeData: Event<TreeItemType | null> = this._onDidChangeTreeData.event;

	/** Holds the current shell snippet items */
	private globalItems: ShellTreeItem[] = [];
	private localItems: ShellTreeItem[] = [];

	/** Inits the tree view */
	constructor() {
		this.refresh();
	}

	/** Returns a shell snippet */
	getTreeItem(element: TreeItemType): TreeItemType {
		return element;
	}

	/** Returns all shell snippets */
	getChildren(element?: TreeItemType): TreeItemType[] {
		if (element?.label === 'Global Shell Snippets') {
			return this.globalItems;
		} else if (element?.label === 'Local Shell Snippets') {
			return this.localItems;
		}
		return [
			new ShellTreeDropdown(
				'Global Shell Snippets',
				Boolean(this.globalItems.length),
				'globe',
				true
			),
			new ShellTreeDropdown(
				'Local Shell Snippets',
				Boolean(this.localItems.length),
				'folder',
				false
			),
		];
	}

	/** Refresh the view */
	refresh(): void {
		const [globalSnippets, localSnippets] = getShellSnippets();
		const constructorHandler = (snippet: ShellSnippet, isLocal: boolean) =>
			new ShellTreeItem(
				snippet.command,
				isLocal,
				snippet.runImmediately,
				snippet.profile || getDefaultShellProfile()
			);

		this.globalItems = globalSnippets.map((snippet) => constructorHandler(snippet, false));
		this.localItems = localSnippets.map((snippet) => constructorHandler(snippet, true));

		this._onDidChangeTreeData.fire(null);
	}
}

export type { ShellViewProvider };
