import vscode from '../../vscode';
import type { SnippetData } from '../../types';
import SnippetDataManager from './SnippetDataManager';
import { getCurrentUri } from '../../utils/fsInfo';

export default class SnippetEditorProvider implements vscode.FileSystemProvider {
	private _emitter: vscode.EventEmitter<vscode.FileChangeEvent[]> = new vscode.EventEmitter<
		vscode.FileChangeEvent[]
	>();
	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

	private _files = new Map<string, Uint8Array>();
	private _directories = new Map<string, Set<string>>();
	private _snippetDataManager: SnippetDataManager;

	public scheme: string = '';

	private _lspDebounce: NodeJS.Timeout | undefined;
	private _insertionFeatureDecorationType = vscode.window.createTextEditorDecorationType({
		color: '#FFF', // White in Dark+
		fontWeight: 'bold',
		light: {
			color: '#D801F8', // Purple for Light+
		},
	});

	constructor(scheme: string, manager: SnippetDataManager) {
		this._directories.set('/snippets', new Set());
		this.scheme = scheme;
		this._snippetDataManager = manager;

		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor?.document.uri.scheme === this.scheme) {
				this._highlightSnippetInsertionFeatures(editor);
			}
		});
	}

	handleDocumentChange(changeEvent: vscode.TextDocumentChangeEvent): void {
		if (
			changeEvent.document.uri.scheme !== this.scheme ||
			changeEvent.contentChanges.length === 0
		) {
			return;
		}

		const change = changeEvent.contentChanges[0];

		if (this._lspDebounce) {
			clearTimeout(this._lspDebounce);
		}
		this._lspDebounce = setTimeout(() => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				this._highlightSnippetInsertionFeatures(editor);
			}
		}, 400);

		// Test for unintential snippet tabstops, changes, and choices
		if (
			change.text >= '0' &&
			change.text <= '9' &&
			vscode.workspace
				.getConfiguration('snippetstudio')
				.get<boolean>('editor.autoEscapeDollarSigns')
		) {
			const newText = escapeDollarSignIfNeeded(changeEvent.document.getText(), change.rangeOffset);

			if (newText === undefined) {
				return;
			}

			// Replace the entire document with the updated text.
			let edit = new vscode.WorkspaceEdit();
			edit.replace(
				changeEvent.document.uri,
				new vscode.Range(
					0,
					0,
					changeEvent.document.lineCount,
					changeEvent.document.getText().length
				),
				newText
			);
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

	readDirectory(
		uri: vscode.Uri
	): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
		const files: [string, vscode.FileType][] = Array.from(this._files.keys())
			.filter((path) => path.startsWith(uri.path))
			.map((path) => [path.substring(uri.path.length + 1), vscode.FileType.File]);
		return files;
	}

	readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
		const path = uri.path;
		if (this._files.has(path)) {
			return this._files.get(path)!;
		}
		throw vscode.FileSystemError.FileNotFound();
	}

	writeFile(
		uri: vscode.Uri,
		content: Uint8Array,
		options: { create: boolean; overwrite: boolean }
	): void | Thenable<void> {
		this._files.set(uri.path, content);
		this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
	}
	async createFile(uri: vscode.Uri, content: string = '') {
		await this.writeFile(uri, new TextEncoder().encode(content), {
			create: true,
			overwrite: true,
		});
		const parentPath = uri.path.substring(uri.path.lastIndexOf('/') + 1);
		const fileName = uri.path.substring(0, uri.path.lastIndexOf('/') + 1);
		if (!this._directories.has(parentPath)) {
			this.createDirectory(vscode.Uri.parse(this.scheme + ':' + parentPath));
		}
		this._directories.get(parentPath)?.add(fileName);
	}

	async mountSnippet(
		uri: vscode.Uri,
		snippetData: SnippetData,
		body: string | undefined = undefined
	) {
		this._snippetDataManager.setData(uri.path, snippetData);
		await this.createFile(uri, body ?? '');
	}

	delete(
		uri: vscode.Uri,
		options: { recursive: boolean } = { recursive: true }
	): void | Thenable<void> {
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

	private _highlightSnippetInsertionFeatures(editor: vscode.TextEditor) {
		const document = editor?.document;
		if (document === undefined) {
			return;
		}

		const text = document.getText();
		const regexes = [
			/(?<!\\)\$\d+/g, // $0, $1
			/(?<!\\)\$\{\d+:[^}]*\}/g, // ${1:placeholder}
			/(?<!\\)\$\{\d+\|[^}]+\|\}/g, // ${2|choice1,choice2|}
			/(?<!\\)\$((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT)/g,
			/(?<!\\)\$\{((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT):([^}]*)\}/g,
			/(?<!\\)\$\{\d+\/.*?\/.*?\/[gimsuy]*\}/g,
		];
		const decorations: vscode.DecorationOptions[] = [];

		for (const match of regexes.flatMap((regex) => Array.from(text.matchAll(regex)))) {
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + match[0].length);
			decorations.push({ range: new vscode.Range(startPos, endPos) });
		}

		editor.setDecorations(this._insertionFeatureDecorationType, decorations);
	}

	// Not needed
	rename(
		oldUri: vscode.Uri,
		newUri: vscode.Uri,
		options: { overwrite: boolean }
	): void | Thenable<void> {}
	watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[] }): vscode.Disposable {
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

/**
 * Adds a backspace before a snippet tabstop, placeholder, or choice
 *
 * @param text string to run the operation on
 * @param offset the position of the number inside the potential tabstop/placeholder/choice
 * @returns the updated text or undefined if nothing changed
 */
function escapeDollarSignIfNeeded(text: string, offset: number): string | undefined {
	const testText = text.slice(offset - 2, offset);

	if (/\$$/.test(testText)) {
		// Is a tabstop
		return text.slice(0, offset - 1) + '\\' + text.slice(offset - 1);
	} else if (/\$\{$/.test(testText)) {
		// Is a placeholder
		return text.slice(0, offset - 2) + '\\' + text.slice(offset - 2);
	}
}
