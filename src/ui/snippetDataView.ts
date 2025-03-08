import * as vscode from "vscode";
import fs from 'fs';
import { getCurrentUri } from "../utils/fsInfo";

export default class SnippetDataWebViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}
    
    async resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableForms: true,
            enableScripts: true,
            localResourceRoots: [this._context.extensionUri]
        };
        this._getHtmlForWebview(webviewView.webview)
            .then(html => webviewView.webview.html = html)
            .then(_ => this.setUpMessages(webviewView))
            .catch(reason => console.error(reason)); 
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

    // --------------- Message Passing ---------------

    private async setUpMessages(webviewView: vscode.WebviewView) {
        const uri = getCurrentUri();
        if (uri) {
            this.updateScopeVisibility(uri.query.includes('showScope=true'));
        }

        // webviewView.webview.onDidReceiveMessage(message => {
        //     // Handle messages from the webview
        // });
    }

    public updateScopeVisibility(showScope: boolean) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateScope', showScope });
        }
    }
}