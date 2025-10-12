import * as vscode from 'vscode';

export class ShellViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | null> = new vscode.EventEmitter<vscode.TreeItem | null>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | null> = this._onDidChangeTreeData.event;

    constructor() {}

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        // Minimal functionality for now
        return Promise.resolve([
            new vscode.TreeItem('Example Shell Snippet', vscode.TreeItemCollapsibleState.None)
        ]);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(null);
    }
}
