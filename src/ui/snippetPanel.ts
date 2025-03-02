import * as vscode from 'vscode';
import { VSCodeSnippets } from '../types/snippetTypes.js';
import loadSnippets from '../snippets/loadSnippets.js';

export class SnippetViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    // ---------- Refresh the tree when the active editor changes ----------
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    // private readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    private snippetTreeItems: vscode.TreeItem[][] | undefined;

    private langId = vscode.window.activeTextEditor?.document.languageId;
    constructor() {
        vscode.window.onDidChangeActiveTextEditor(async () => { 
            const newLangId: string | undefined = vscode.window.activeTextEditor?.document.languageId;
            if (this.langId !== newLangId) {
                await this.refresh(); 
                this.langId = newLangId;
            }
        });
    }
    public async refresh() {
        this._onDidChangeTreeData.fire();
        this.snippetTreeItems = await loadSnippets();
    }

    // ---------- INIT TREE ----------
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[] | null | undefined> {
        if (element) {
            if (element.label === 'Dropdown') {
                // Return items for the dropdown
                return [
                    new vscode.TreeItem('Option 1'),
                    new vscode.TreeItem('Option 2')
                ];
            }
            // Logic for child items (if any)
            return [];
        } else {
            // Logic for root items
            return [
                new vscode.TreeItem(this.langId === undefined ? "No Language Open" : `${this.langId}`.toUpperCase()),
                new vscode.TreeItem('Dropdown', vscode.TreeItemCollapsibleState.Collapsed),
                ...this.snippetTreeItems!.flat()
            ];
        }
    }



    

}
