import * as vscode from "vscode";
import fs from 'fs';
import { getCurrentUri } from "../utils/fsInfo";
import SnippetDataManager from "../snippets/snippetDataManager";

export default class SnippetDataWebViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _snippetDataManager: SnippetDataManager;

    constructor(private readonly _context: vscode.ExtensionContext, manager: SnippetDataManager) {
        this._snippetDataManager = manager;
    }
    
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
            this.initMessages(uri);
        }

        // webviewView.webview.onDidReceiveMessage(message => {
        //     // Handle messages from the webview
        // });
    }

    public initMessages(uri: vscode.Uri) {
        const view = this._view?.webview;
        if (view) {
            view.postMessage({ command: 'updateScope', showScope: uri.query.includes('showScope=true') });
            view.postMessage({ command: 'setFilename', filename: this._snippetDataManager.getData(uri.path)?.filename });

        }
    }
}