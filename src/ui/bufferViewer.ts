import * as vscode from "vscode";

export default class SnippetContentProvider implements vscode.TextDocumentContentProvider {
    private _content: string = '';
    private _onDidChange: vscode.EventEmitter<vscode.Uri> = new vscode.EventEmitter<vscode.Uri>();
    public readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event;
    private _documentType: string | undefined;
    private _uri: vscode.Uri | undefined;

    public constructor(content: string[], documentType: string) {
        this._content = content.join('\n');
        this._documentType = documentType;
    }

    public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
        this._uri = uri;
        return this._content;
    }

    public update(content: string, uri: vscode.Uri) {
        this._content = content;
        this._onDidChange.fire(uri);
    }

    public getDocumentType(): string | undefined {
        return this._documentType;
    }

    public setContent(content: string, uri: vscode.Uri){
        this.update(content, uri);
    }
}

