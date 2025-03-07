import * as vscode from "vscode";
import fs from 'fs';

export default class SnippetDataWebViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}
    
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };
        this._getHtmlForWebview(webviewView.webview)
            .then(html => webviewView.webview.html = html);
    }

    private async _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = vscode.Uri.joinPath(this._context.extensionUri, 'src', 'ui', 'snippetData.html');
        
        try {
            return await fs.promises.readFile(htmlPath.fsPath, 'utf8');
        } catch (error) {
            console.error('Error reading HTML file:', error);
            return '<h1>Error loading webview content.</h1>';
        }
    }

}