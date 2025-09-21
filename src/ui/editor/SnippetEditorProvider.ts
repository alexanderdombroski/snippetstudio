import type {
	FileSystemProvider,
	EventEmitter,
	FileChangeEvent,
	Event,
	TextDocumentChangeEvent,
	FileType,
	Uri as UriType,
	FileStat,
	Disposable,
} from 'vscode';
import vscode, { onDidChangeActiveTextEditor, getConfiguration, Range, Uri } from '../../vscode';
import type { SnippetData } from '../../types';
import SnippetDataManager from './SnippetDataManager';
import { getCurrentUri } from '../../utils/fsInfo';
import { highlightSnippetInsertionFeatures } from '../syntax';

/** Provider that handles a custom buffer editor and changes within the editor */
export default class SnippetEditorProvider implements FileSystemProvider {
	private _emitter: EventEmitter<FileChangeEvent[]> = new vscode.EventEmitter<FileChangeEvent[]>();
	readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

	private _files = new Map<string, Uint8Array>();
	private _directories = new Map<string, Set<string>>();
	private _snippetDataManager: SnippetDataManager;

	public scheme: string = '';

	private _lspDebounce: NodeJS.Timeout | undefined;

	constructor(scheme: string, manager: SnippetDataManager) {
		this._directories.set('/snippets', new Set());
		this.scheme = scheme;
		this._snippetDataManager = manager;

		onDidChangeActiveTextEditor((editor) => {
			if (editor?.document.uri.scheme === this.scheme) {
				highlightSnippetInsertionFeatures(editor);
			}
		});
	}

	/** triggers change events and refreshes, including editor syntax highlighting */
	handleDocumentChange(changeEvent: TextDocumentChangeEvent): void {
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
				highlightSnippetInsertionFeatures(editor);
			}
		}, 400);

		// Test for unintential snippet tabstops, changes, and choices
		if (
			change.text >= '0' &&
			change.text <= '9' &&
			getConfiguration('snippetstudio').get<boolean>('editor.autoEscapeDollarSigns')
		) {
			const newText = __escapeDollarSignIfNeeded(
				changeEvent.document.getText(),
				change.rangeOffset
			);

			if (newText === undefined) {
				return;
			}

			// Replace the entire document with the updated text.
			let edit = new vscode.WorkspaceEdit();
			edit.replace(
				changeEvent.document.uri,
				new Range(0, 0, changeEvent.document.lineCount, changeEvent.document.getText().length),
				newText
			);
			vscode.workspace.applyEdit(edit);
		}
	}

	/** creates new directory */
	createDirectory(uri: UriType): void | Thenable<void> {
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

	/** returns the files within a virtual directory */
	readDirectory(uri: UriType): [string, FileType][] | Thenable<[string, FileType][]> {
		const files: [string, FileType][] = Array.from(this._files.keys())
			.filter((path) => path.startsWith(uri.path))
			.map((path) => [path.substring(uri.path.length + 1), vscode.FileType.File]);
		return files;
	}

	/** returns the contents of a buffer */
	readFile(uri: UriType): Uint8Array | Thenable<Uint8Array> {
		const path = uri.path;
		if (this._files.has(path)) {
			return this._files.get(path)!;
		}
		throw vscode.FileSystemError.FileNotFound();
	}

	/** writes to a buffer and triggers change events */
	writeFile(
		uri: UriType,
		content: Uint8Array,
		// eslint-disable-next-line no-unused-vars
		options: { create: boolean; overwrite: boolean }
	): void | Thenable<void> {
		this._files.set(uri.path, content);
		this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
	}

	/** creates a snippet editor buffer and directory to store it in */
	async createFile(uri: UriType, content: string = '') {
		await this.writeFile(uri, new TextEncoder().encode(content), {
			create: true,
			overwrite: true,
		});
		const parentPath = uri.path.substring(uri.path.lastIndexOf('/') + 1);
		const fileName = uri.path.substring(0, uri.path.lastIndexOf('/') + 1);
		if (!this._directories.has(parentPath)) {
			this.createDirectory(Uri.parse(this.scheme + ':' + parentPath));
		}
		this._directories.get(parentPath)?.add(fileName);
	}

	/** create a new buffer, track snippet data, and open an editor */
	async mountSnippet(uri: UriType, snippetData: SnippetData, body: string | undefined = undefined) {
		this._snippetDataManager.setData(uri.path, snippetData);
		await this.createFile(uri, body ?? '');
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	delete(
		uri: UriType,
		// eslint-disable-next-line no-unused-vars
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

	/** returns snippet data of an open editor */
	getSnippetData(): SnippetData | undefined {
		const uri = getCurrentUri();
		if (uri) {
			return this._snippetDataManager.getData(uri.path);
		}
	}

	// eslint-disable-next-line jsdoc/require-jsdoc
	rename(
		// eslint-disable-next-line no-unused-vars
		oldUri: UriType,
		// eslint-disable-next-line no-unused-vars
		newUri: UriType,
		// eslint-disable-next-line no-unused-vars
		options: { overwrite: boolean }
	): void | Thenable<void> {}

	// eslint-disable-next-line jsdoc/require-jsdoc, no-unused-vars
	watch(uri: UriType, options: { recursive: boolean; excludes: string[] }): Disposable {
		// Implement watch logic (e.g., for external changes).
		return new vscode.Disposable(() => {}); // Placeholder
	}

	/** returns data about the file */
	stat(uri: UriType): FileStat | Thenable<FileStat> {
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
 * @param text string to run the operation on
 * @param offset the position of the number inside the potential tabstop/placeholder/choice
 * @returns the updated text or undefined if nothing changed
 */
export function __escapeDollarSignIfNeeded(text: string, offset: number): string | undefined {
	const testText = text.slice(offset - 2, offset);

	if (/\$$/.test(testText)) {
		// Is a tabstop
		return text.slice(0, offset - 1) + '\\' + text.slice(offset - 1);
	} else if (/\$\{$/.test(testText)) {
		// Is a placeholder
		return text.slice(0, offset - 2) + '\\' + text.slice(offset - 2);
	}
}
