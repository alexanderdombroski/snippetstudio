import type {
	WebviewViewProvider,
	ExtensionContext,
	WebviewView,
	Webview,
	WebviewViewResolveContext,
	CancellationToken,
	Disposable,
	Uri as UriType,
} from 'vscode';
import { Uri, executeCommand, onDidChangeActiveTextEditor } from '../../vscode';
import fs from 'node:fs/promises';
import { getCurrentUri } from '../../utils/fsInfo';
import type SnippetDataManager from './SnippetDataManager';
import type { SnippetData } from '../../types';
import { getVersion } from '../../utils/context';

/** Reads HTML for webview and sets up data connection via message passing */
export default class SnippetDataWebViewProvider implements WebviewViewProvider {
	private _view?: WebviewView;
	private _snippetDataManager: SnippetDataManager;
	private _isGlobEngineSupport: boolean;

	constructor(
		private readonly _context: ExtensionContext,
		manager: SnippetDataManager
	) {
		this._snippetDataManager = manager;
		const version = getVersion();
		this._isGlobEngineSupport = !!version && version.minor >= 109;
	}

	/** loads the webview and sets up messages */
	async resolveWebviewView(
		webviewView: WebviewView,
		// eslint-disable-next-line no-unused-vars
		context: WebviewViewResolveContext,
		// eslint-disable-next-line no-unused-vars
		token: CancellationToken
	): Promise<void> {
		this._view = webviewView;

		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				this.setUpMessages(webviewView);
			}
		});

		webviewView.webview.options = {
			enableForms: true,
			enableScripts: true,
			localResourceRoots: [this._context.extensionUri],
		};
		this._getHtmlForWebview(webviewView.webview)
			.then((html) => (webviewView.webview.html = html))
			.then(() => this.setUpMessages(webviewView))
			.catch((reason) => console.error(reason));
	}

	// eslint-disable-next-line jsdoc/require-jsdoc, no-unused-vars
	private async _getHtmlForWebview(webview: Webview) {
		const htmlPath = Uri.joinPath(this._context.extensionUri, 'dist', 'snippetData.html');

		try {
			return await fs.readFile(htmlPath.fsPath, 'utf8');
		} catch (error) {
			console.error('Error reading HTML file:', error);
			return '<h1>Error loading webview content.</h1>';
		}
	}

	// --------------- Message Passing ---------------

	/** sets up message passing between snippet editor and data view */
	private async setUpMessages(webviewView: WebviewView) {
		const uri = getCurrentUri();
		if (uri) {
			this.initMessages(uri);
		}

		webviewView.webview.onDidReceiveMessage((message) => {
			switch (message.command) {
				case 'updateSnippetData': {
					// Change the saveable context to prevent preemptive saving
					const snippetData: SnippetData = message.data;
					const uriKey = getCurrentUri()?.path;
					if (uriKey) {
						this._snippetDataManager.setData(uriKey, snippetData);
					}
					executeCommand('snippetstudio.editor.save');
					break;
				}
				case 'updatePartialSnippetData': {
					const { data, type }: { data: string; type: keyof SnippetData } = message.data;
					const uriKey = getCurrentUri()?.path;
					if (uriKey) {
						this._snippetDataManager.setPartialData(uriKey, type, data);
					}
					break;
				}
				default:
					console.warn(`Unknown message passed to snippetData Form WebView ${message.command}`);
					break;
			}
		});
	}

	private schemeNotifier: Disposable | undefined;

	/** sets up messages passing and sets up snippet format */
	public initMessages(uri: UriType) {
		const view = this._view?.webview;
		if (view) {
			view.postMessage({
				command: 'filterFields',
				showScope: uri.query.includes('showScope=true'),
				showGlob: this._isGlobEngineSupport,
			});
			if (this._snippetDataManager.hasKey(uri.path)) {
				view.postMessage({
					command: 'initForm',
					data: this._snippetDataManager.getData(uri.path),
				});
			}
			this.schemeNotifier?.dispose();
			this.schemeNotifier = onDidChangeActiveTextEditor((editor) => {
				view.postMessage({
					command: 'setIsEditorActive',
					data: editor?.document.uri.scheme === 'snippetstudio',
				});
			});
		}
	}
}
