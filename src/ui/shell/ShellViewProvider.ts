import type { Event, EventEmitter, TreeItem as TreeItemType, TreeDataProvider } from 'vscode';
import vscode, { TreeItem } from '../../vscode';
import { getShellSnippets } from './config';

let shellViewProvider: ShellViewProvider | undefined;

/** Returns the singleton shell view provider class */
export function getShellView(): ShellViewProvider {
	if (!shellViewProvider) {
		shellViewProvider = new ShellViewProvider();
		vscode.window.createTreeView('shell-snippets', { treeDataProvider: shellViewProvider });
	}
	return shellViewProvider;
}

/** Constructs a tree item to be used in the shell snippet view */
export class ShellTreeItem extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly isLocal: boolean,
		public readonly runImmediately: boolean
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'shell-snippet';
	}
}

/** Tree View to display all shell snippets */
class ShellViewProvider implements TreeDataProvider<TreeItemType> {
	private _onDidChangeTreeData: EventEmitter<TreeItemType | null> =
		new vscode.EventEmitter<TreeItemType | null>();
	readonly onDidChangeTreeData: Event<TreeItemType | null> = this._onDidChangeTreeData.event;

	/** Holds the current shell snippet items */
	private treeItems: ShellTreeItem[] = [];

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
		if (element) {
			return [];
		}
		return this.treeItems;
	}

	/** Refresh the view */
	refresh(): void {
		const [globalSnippets, localSnippets] = getShellSnippets();

		const newItems: ShellTreeItem[] = [];

		// Create tree items for global snippets
		for (const snippet of globalSnippets) {
			newItems.push(new ShellTreeItem(snippet.command, false, snippet.runImmediately));
		}

		// Create tree items for local snippets
		for (const snippet of localSnippets) {
			newItems.push(new ShellTreeItem(snippet.command, true, snippet.runImmediately));
		}

		this.treeItems = newItems;
		this._onDidChangeTreeData.fire(null);
	}
}

export type { ShellViewProvider };
