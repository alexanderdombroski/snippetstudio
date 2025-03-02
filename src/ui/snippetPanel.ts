import * as vscode from 'vscode';

export class SnippetViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    // ---------- INIT TREE ----------
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem[]> {
        if (element) {
            if (element.label === 'Dropdown') {
                // Return items for the dropdown
                return [
                    new vscode.TreeItem('Option 1'),
                    new vscode.TreeItem('Option 2'),
                    new vscode.TreeItem('Option 3'),
                    new vscode.TreeItem('Option 4')
                ];
            }
            // Logic for child items (if any)
            return [];
        } else {
            // Logic for root items
            return [
                new vscode.TreeItem(this.langId === undefined ? "No Language Open" : `${this.langId}`.toUpperCase()),
                new vscode.TreeItem('Snippet 1', vscode.TreeItemCollapsibleState.None),
                new vscode.TreeItem('Snippet 2'),
                new vscode.TreeItem('Snippet 3'),
                new vscode.TreeItem('Dropdown', vscode.TreeItemCollapsibleState.Collapsed)
            ];
        }
    }



    // ---------- Refresh the tree when the active editor changes ----------
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    // private readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    private langId = vscode.window.activeTextEditor?.document.languageId;
    constructor() {
        vscode.window.onDidChangeActiveTextEditor(() => { 
            const newLangId: string | undefined = vscode.window.activeTextEditor?.document.languageId;
            if (this.langId !== newLangId) {
                this.refresh(); 
                this.langId = newLangId;
            }
        });
    }

}
