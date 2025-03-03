import * as vscode from 'vscode';
import loadSnippets from '../snippets/loadSnippets.js';
import { selectedLanguageTemplate } from './templates.js';
import { getCurrentLanguage } from '../utils/language.js';

type ParentChildTreeItems = [vscode.TreeItem, vscode.TreeItem[]][];

export default class SnippetViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    // ---------- Attributes ---------- //
    private snippetTreeItems: ParentChildTreeItems | undefined;
    private langId: string | undefined;
    private debounceTimer: NodeJS.Timeout | undefined;
    
    // ---------- Constructor ---------- //
    constructor() {
        this.langId = getCurrentLanguage();
        this.refresh();

        vscode.window.onDidChangeActiveTextEditor(async () => {
            const newLangId = getCurrentLanguage();
            if (newLangId && this.langId !== newLangId) {
                this.langId = newLangId;
                this.debounceRefresh();
            }
        });
    }

    // ---------- Refresh Methods ---------- //
    private async refresh() {
        this.snippetTreeItems = await loadSnippets();
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

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[] | undefined> {
        if (element) {
            // Handle child items
            const parentChild = this.snippetTreeItems?.find(group => group[0].description === element.description);
            return parentChild ? parentChild[1] : undefined;
        }
        // Root level: Load snippet files and create parent items
        if (!this.snippetTreeItems) {
            this.snippetTreeItems = await loadSnippets();
        }

        const rootItems: vscode.TreeItem[] = [selectedLanguageTemplate(this.langId)]; // Always add the template

        if (this.snippetTreeItems && this.snippetTreeItems.length > 0) {
            // Add the snippet groups if they exist
            rootItems.push(...this.snippetTreeItems.map(group => group[0]));
        }

        return rootItems;
    }


    // ---------- Event Emitters ---------- //
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

}
