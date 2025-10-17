import type { Event, EventEmitter, TreeItem as TreeItemType, TreeDataProvider } from 'vscode';
import vscode, { TreeItem, None, Expanded, ThemeIcon } from '../../vscode';
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
		super(label, None);
		this.contextValue = 'shell-snippet';
	}
}

/** Constructs a dropdown to organize shell items */
class ShellTreeDropdown extends TreeItem {
	constructor(
		public readonly label: string,
		public readonly hasItems: boolean,
		public readonly icon: string
	) {
		super(label, hasItems ? Expanded : None);
		this.iconPath = new ThemeIcon(icon);
		this.contextValue = 'shell-dropdown';
	}
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
			new ShellTreeDropdown('Global Shell Snippets', Boolean(this.globalItems.length), 'globe'),
			new ShellTreeDropdown('Local Shell Snippets', Boolean(this.localItems.length), 'folder'),
		];
	}

	/** Refresh the view */
	refresh(): void {
		const [globalSnippets, localSnippets] = getShellSnippets();

		this.globalItems = globalSnippets.map(
			(snippet) => new ShellTreeItem(snippet.command, false, snippet.runImmediately)
		);
		this.localItems = localSnippets.map(
			(snippet) => new ShellTreeItem(snippet.command, true, snippet.runImmediately)
		);

		this._onDidChangeTreeData.fire(null);
	}
}

export type { ShellViewProvider };
