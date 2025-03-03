import * as vscode from 'vscode';
import { locateAllSnippetFiles } from '../snippets/locateSnippets';
import { snippetLocationTemplate } from './templates';

export default class LocationTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    private localTreeItems: vscode.TreeItem[] = [];
    private globalTreeItems: vscode.TreeItem[] = [];
    private debounceTimer: NodeJS.Timeout | undefined;
    
    // ---------- Constructor ---------- //
    constructor() {
        this.refresh();
    }


    // ---------- Refresh Methods ---------- //
    private async refresh() {
        const [locals, globals] = await locateAllSnippetFiles();
        this.localTreeItems = locals.map(p => snippetLocationTemplate(p));
        this.globalTreeItems = globals.map(p => snippetLocationTemplate(p));
        this._onDidChangeTreeData.fire();
    }
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
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
        if (this.localTreeItems.length === 0 && this.globalTreeItems.length === 0) {
            return [];
        }
        
        if (element) {
            if (element.label === "Global Snippets") {
                return this.globalTreeItems;
            } else if (element.label === "Local Snippets") {
                return this.localTreeItems;
            }
            return [];
        }
        return [
            new vscode.TreeItem("Global Snippets", vscode.TreeItemCollapsibleState.Collapsed),
            new vscode.TreeItem("Local Snippets", vscode.TreeItemCollapsibleState.Collapsed)
        ];
    }


    // ---------- Event Emitters ---------- //
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

}