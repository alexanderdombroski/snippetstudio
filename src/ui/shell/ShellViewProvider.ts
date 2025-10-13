import type {
	Event,
	EventEmitter,
	TreeItem as TreeItemType,
	TreeDataProvider,
	TreeItemLabel,
} from 'vscode';
import vscode, { TreeItem } from '../../vscode';

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
		public readonly label: string | TreeItemLabel,
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

	/** Inits the tree view */
	constructor() {}

	/** Returns a shell snippet */
	getTreeItem(element: TreeItemType): TreeItemType {
		return element;
	}

	/** Returns a all levels of shell snippets recursively */
	// eslint-disable-next-line
	getChildren(element?: TreeItemType): Thenable<TreeItemType[]> {
		// Minimal functionality for now
		return Promise.resolve([]);
	}

	/** Refresh the view */
	refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}
}

export type { ShellViewProvider };
