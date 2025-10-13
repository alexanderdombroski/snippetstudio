import type { Event, EventEmitter, TreeItem, TreeDataProvider } from 'vscode';
import vscode from '../../vscode';

let shellViewProvider: ShellViewProvider | undefined;

/** Returns the singleton shell view provider class */
export function getShellView(): ShellViewProvider {
	if (!shellViewProvider) {
		shellViewProvider = new ShellViewProvider();
		vscode.window.createTreeView('shell-snippets', { treeDataProvider: shellViewProvider });
	}
	return shellViewProvider;
}

/** Tree View to display all shell snippets */
class ShellViewProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | null> =
		new vscode.EventEmitter<TreeItem | null>();
	readonly onDidChangeTreeData: Event<TreeItem | null> = this._onDidChangeTreeData.event;

	/** Inits the tree view */
	constructor() {}

	/** Returns a shell snippet */
	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	/** Returns a all levels of shell snippets recursively */
	// eslint-disable-next-line
	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		// Minimal functionality for now
		return Promise.resolve([]);
	}

	/** Refresh the view */
	refresh(): void {
		this._onDidChangeTreeData.fire(null);
	}
}

export type { ShellViewProvider };
