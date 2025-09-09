import type {
	FileSystemProvider,
	EventEmitter,
	FileChangeEvent,
	Event,
	TextDocumentChangeEvent,
	FileType,
	Uri as UriType,
	TextEditor,
	DecorationOptions,
	FileStat,
	Disposable,
	TextDocument,
	Range as RangeType,
} from 'vscode';
import vscode, {
	onDidChangeActiveTextEditor,
	getConfiguration,
	Range,
	Uri,
	createTextEditorDecorationType,
} from '../../vscode';
import type { SnippetData } from '../../types';
import SnippetDataManager from './SnippetDataManager';
import { getCurrentUri } from '../../utils/fsInfo';

export default class SnippetEditorProvider implements FileSystemProvider {
	private _emitter: EventEmitter<FileChangeEvent[]> = new vscode.EventEmitter<FileChangeEvent[]>();
	readonly onDidChangeFile: Event<FileChangeEvent[]> = this._emitter.event;

	private _files = new Map<string, Uint8Array>();
	private _directories = new Map<string, Set<string>>();
	private _snippetDataManager: SnippetDataManager;

	public scheme: string = '';

	private _lspDebounce: NodeJS.Timeout | undefined;
	private _insertionFeatureDecorationType = createTextEditorDecorationType({
		color: '#FFF', // White in Dark+
		fontWeight: 'bold',
		light: {
			color: '#D801F8', // Purple for Light+
		},
	});

	// The red squigglys in your editor are SVGs btw, and there's no way to remove diagnostics.
	private _diagnosticSuppressorDecorationType = createTextEditorDecorationType({
		backgroundColor: 'var(--vscode-editor-background)',
		textDecoration: 'underline wavy var(--vscode-editor-background)', // Mask underline squiggles
		isWholeLine: true,
	});
	private _diagnosticSuppressorDecorationOverLine = createTextEditorDecorationType({
		textDecoration: 'overline wavy var(--vscode-editor-background)', // Additional Coverup underline squiggles
		isWholeLine: true,
	});

	constructor(scheme: string, manager: SnippetDataManager) {
		this._directories.set('/snippets', new Set());
		this.scheme = scheme;
		this._snippetDataManager = manager;

		onDidChangeActiveTextEditor((editor) => {
			if (editor?.document.uri.scheme === this.scheme) {
				this._highlightSnippetInsertionFeatures(editor);
			}
		});
	}

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
				this._highlightSnippetInsertionFeatures(editor);
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

	readDirectory(uri: UriType): [string, FileType][] | Thenable<[string, FileType][]> {
		const files: [string, FileType][] = Array.from(this._files.keys())
			.filter((path) => path.startsWith(uri.path))
			.map((path) => [path.substring(uri.path.length + 1), vscode.FileType.File]);
		return files;
	}

	readFile(uri: UriType): Uint8Array | Thenable<Uint8Array> {
		const path = uri.path;
		if (this._files.has(path)) {
			return this._files.get(path)!;
		}
		throw vscode.FileSystemError.FileNotFound();
	}

	writeFile(
		uri: UriType,
		content: Uint8Array,
		// eslint-disable-next-line no-unused-vars
		options: { create: boolean; overwrite: boolean }
	): void | Thenable<void> {
		this._files.set(uri.path, content);
		this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
	}
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

	async mountSnippet(uri: UriType, snippetData: SnippetData, body: string | undefined = undefined) {
		this._snippetDataManager.setData(uri.path, snippetData);
		await this.createFile(uri, body ?? '');
	}

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

	getSnippetData(): SnippetData | undefined {
		const uri = getCurrentUri();
		if (uri) {
			return this._snippetDataManager.getData(uri.path);
		}
	}

	private _highlightSnippetInsertionFeatures(editor: TextEditor) {
		const document = editor.document;
		const shouldMaskDiagnostics = getConfiguration('snippetstudio').get<boolean>(
			'editor.suppressDiagnostics'
		);
		const diagnostics = shouldMaskDiagnostics
			? vscode.languages.getDiagnostics(document.uri)
			: undefined;

		const text = document.getText();
		const regexes = [
			/(?<!\\)\$\d+/g, // $0, $1
			/(?<!\\)\$\{\d+:[^}]*\}/g, // ${1:placeholder}
			/(?<!\\)\$\{\d+\|[^}]+\|\}/g, // ${2|choice1,choice2|}
			/(?<!\\)\$((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT)/g,
			/(?<!\\)\$\{((TM_(SELECTED_TEXT|CURRENT_(LINE|WORD)|LINE_(INDEX|NUMBER)|FILE(NAME(_BASE)?|PATH)|DIRECTORY))|CLIPBOARD|RELATIVE_FILEPATH|(WORKSPACE_(NAME|FOLDER))|CURSOR_(INDEX|NUMBER)|CURRENT_(YEAR(_SHORT)?|MONTH(_NAME(_SHORT)?)?|DA(TE|Y_NAME(_SHORT)?)|HOUR|MINUTE|SECOND(S_UNIX)?|TIMEZONE_OFFSET)|RANDOM(_HEX)?|UUID|BLOCK_COMMENT_(START|END)|LINE_COMMENT):([^}]*)\}/g,
			/(?<!\\)\$\{\d+\/.*?\/.*?\/[gimsuy]*\}/g,
		];
		const decorations: DecorationOptions[] = [];
		const supressedDiagnostics: DecorationOptions[] = [];
		const supressedDiagnosticsOverLine: DecorationOptions[] = [];

		for (const match of regexes.flatMap((regex) => Array.from(text.matchAll(regex)))) {
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + match[0].length);
			const range = new Range(startPos, endPos);
			decorations.push({ range });

			diagnostics
				?.filter((dg) => dg.range.intersection(range))
				.forEach((dg) => {
					supressedDiagnostics.push({ range: dg.range });
					supressedDiagnosticsOverLine.push({ range: moveRangeDown(dg.range, document) });
					diagnostics.splice(diagnostics.indexOf(dg), 1);
				});
		}

		editor.setDecorations(this._insertionFeatureDecorationType, decorations);
		if (shouldMaskDiagnostics) {
			editor.setDecorations(this._diagnosticSuppressorDecorationType, supressedDiagnostics);
			editor.setDecorations(
				this._diagnosticSuppressorDecorationOverLine,
				supressedDiagnosticsOverLine
			);
		}
	}

	rename(
		// eslint-disable-next-line no-unused-vars
		oldUri: UriType,
		// eslint-disable-next-line no-unused-vars
		newUri: UriType,
		// eslint-disable-next-line no-unused-vars
		options: { overwrite: boolean }
	): void | Thenable<void> {}
	// eslint-disable-next-line no-unused-vars
	watch(uri: UriType, options: { recursive: boolean; excludes: string[] }): Disposable {
		// Implement watch logic (e.g., for external changes).
		return new vscode.Disposable(() => {}); // Placeholder
	}
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
 *
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

function moveRangeDown(range: RangeType, document: TextDocument): RangeType {
	const newStartLine = Math.min(range.start.line + 1, document.lineCount - 1);
	const newEndLine = Math.min(range.end.line + 1, document.lineCount - 1);

	// Clamp the character positions to the line length
	const newStartChar = Math.min(range.start.character, document.lineAt(newStartLine).text.length);
	const newEndChar = Math.min(range.end.character, document.lineAt(newEndLine).text.length);

	return new vscode.Range(newStartLine, newStartChar, newEndLine, newEndChar);
}
