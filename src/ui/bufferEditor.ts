import * as vscode from "vscode";
import { SnippetData } from "../types/snippetTypes";
import SnippetDataManager from "../snippets/snippetDataManager";
import { getCurrentUri } from "../utils/fsInfo";
import { escapeDollarSignIfNeeded } from "../utils/string";

export default class SnippetEditorProvider implements vscode.FileSystemProvider {
    private _emitter: vscode.EventEmitter<vscode.FileChangeEvent[]> = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;
    
    private _files = new Map<string, Uint8Array>();
    private _directories = new Map<string, Set<string>>();
    private _snippetDataManager: SnippetDataManager;

    public scheme: string = "";

    constructor(scheme: string, manager: SnippetDataManager) {
        this._directories.set('/snippets', new Set());
        this.scheme = scheme;
        this._snippetDataManager = manager;
    }

    handleDocumentChange(changeEvent: vscode.TextDocumentChangeEvent): void {
        if (changeEvent.document.uri.scheme !== this.scheme || changeEvent.contentChanges.length === 0) {
            return;
        }

        const change = changeEvent.contentChanges[0];

        // Test for unintential snippet tabstops, changes, and choices
        if (change.text >= '0' && change.text <= '9') {            
            const newText = escapeDollarSignIfNeeded(changeEvent.document.getText(), change.rangeOffset);
            
            if (newText === undefined) {
                return;
            }

            // Replace the entire document with the updated text.
            let edit = new vscode.WorkspaceEdit();
            edit.replace(changeEvent.document.uri, new vscode.Range(0, 0, changeEvent.document.lineCount, changeEvent.document.getText().length), newText);
            vscode.workspace.applyEdit(edit);
        }
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        const dirPath = uri.path;
        const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/'));
        const dirName = dirPath.substring(dirPath.lastIndexOf('/') + 1);
    
        if (!this._directories.has(dirPath)) {
            this._directories.set(dirPath, new Set());
    
            if (parentPath) {
                if (!this._directories.has(parentPath)) {
                    this._directories.set(parentPath, new Set());
                }
    
                this._directories.get(parentPath)?.add(dirName);
            }
    
            this._emitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
        } else {
            throw vscode.FileSystemError.FileExists();
        }
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        const files: [string, vscode.FileType][] = Array.from(this._files.keys())
            .filter(path => path.startsWith(uri.path))
            .map(path => [path.substring(uri.path.length + 1), vscode.FileType.File]);
        return files;
    }
  
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        const path = uri.path;
        if (this._files.has(path)) {
            return this._files.get(path)!;
        }
        throw vscode.FileSystemError.FileNotFound();
    }
  
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        this._files.set(uri.path, content);
        this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    }
    async createFile(uri: vscode.Uri, content: string = "") {
        await this.writeFile(uri, new TextEncoder().encode(content), {create: true, overwrite: true});
        const parentPath = uri.path.substring(uri.path.lastIndexOf('/') + 1);
        const fileName = uri.path.substring(0, uri.path.lastIndexOf('/') + 1);
        if (!this._directories.has(parentPath)) {
            this.createDirectory(vscode.Uri.parse(this.scheme + ":" + parentPath));
        }
        this._directories.get(parentPath)?.add(fileName);
    }

    async mountSnippet(uri: vscode.Uri, snippetData: SnippetData, body: string | undefined = undefined) {
        this._snippetDataManager.setData(uri.path, snippetData);
        await this.createFile(uri, body ?? "");
    }
  
    delete(uri: vscode.Uri, options: { recursive: boolean; } = { recursive: true }): void | Thenable<void> {
        const parentPath = uri.path.substring(0, uri.path.lastIndexOf('/'));
        const fileName = uri.path.substring(uri.path.lastIndexOf('/') + 1);
        if (this._files.has(uri.path)) {
            this._files.delete(uri.path);

            if (this._directories.has(parentPath)) {
                this._directories.get(parentPath)?.delete(fileName);
            }
            this._snippetDataManager.deleteData(uri.path);
            this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
        }
    }

    getSnippetData(): SnippetData | undefined {
        const uri = getCurrentUri();
        if (uri) {
            return this._snippetDataManager.getData(uri.path);
        }
    }
    
    // Not needed
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {}
    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        // Implement watch logic (e.g., for external changes).
        return new vscode.Disposable(() => {}); // Placeholder
    }
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        const path = uri.path;
        if (this._files.has(path)) {
            return {
                type: vscode.FileType.File,
                ctime: Date.now(),
                mtime: Date.now(),
                size: this._files.get(path)!.length,
            };
        } else if (this._directories.has(path)) {
            return {
                type: vscode.FileType.Directory,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 0,
            };
        }
        throw vscode.FileSystemError.FileNotFound();
    }
}

