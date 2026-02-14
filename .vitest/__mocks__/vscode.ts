/* eslint-disable jsdoc/require-jsdoc */
import { vi } from 'vitest';
import path from 'node:path';

// Basic classes and constructors
export const Uri = {
	file: (path: string) => ({ fsPath: path }), // minimal Uri mock
	parse: vi.fn((uri: string) => {
		// very naive parse (sufficient for tests)
		const url = new URL(uri);
		return {
			scheme: url.protocol.replace(':', ''),
			path: url.pathname,
			query: url.search ? url.search.substring(1) : undefined,
			fragment: url.hash ? url.hash.substring(1) : undefined,
			toString: () => uri,
		};
	}),
	joinPath: vi.fn(),
	from: vi.fn((obj) => obj),
};
export const SnippetString = vi.fn();
export const CompletionItem = vi.fn(function (this: { label: string }, label: string) {
	this.label = label;
});
export const MarkdownString = vi.fn(
	class MarkdownString {
		value: string;
		constructor(str: string) {
			this.value = str;
		}
		appendMarkdown = vi.fn();
	}
);
export const ThemeIcon = class {
	iconPath: string;

	constructor(iconPath: string) {
		this.iconPath = iconPath;
	}

	toString(): string {
		return this.iconPath;
	}
};
export class Range {
	start: { line: number; character: number };
	end: { line: number; character: number };

	constructor(startLine: number, startChar: number, endLine: number, endChar: number) {
		this.start = { line: startLine, character: startChar };
		this.end = { line: endLine, character: endChar };
	}
}
export class Position {
	constructor(
		public line: number,
		public end?: number
	) {}
}
export const Selection = class {
	start: typeof Position;
	end: typeof Position;
	constructor(start: typeof Position, end: typeof Position) {
		this.start = start;
		this.end = end;
	}
};
export { TextEditor } from './shared';
export { TreeItem } from './shared';

// Commands
export const registerTextEditorCommand = vi.fn();
export const registerCommand = vi.fn();
export const executeCommand = vi.fn();

// CompletionItemKind
export const Event = {};

// Workspace
export const onDidChangeTextDocument = vi.fn();
export const getConfiguration = vi.fn().mockReturnValue({
	get: vi.fn(),
	inspect: vi.fn(),
	update: vi.fn(),
});
export const openTextDocument = vi.fn();
export const createTextEditorDecorationType = vi.fn();

// Helper to create a mock returning a Thenable<T>
const makeThenable = <T>(impl?: (...args: any[]) => T) => {
	const fn = vi.fn((...args: any[]): Promise<T> => {
		if (impl) {
			return Promise.resolve(impl(...args));
		}
		return Promise.resolve(undefined as unknown as T);
	});
	return fn;
};

// Window
export const showQuickPick = vi.fn();
export const showInformationMessage = makeThenable((message: string) => message);
export const showWarningMessage = makeThenable((message: string) => message);
export const showErrorMessage = makeThenable((message: string) => message);
export const showInputBox = vi.fn();
export const showTextDocument = vi.fn().mockResolvedValue({});
export const createTerminal = vi.fn().mockReturnValue({
	show: vi.fn(),
	sendText: vi.fn(),
});
export const showOpenDialog = vi.fn();
export const showSaveDialog = vi.fn();
export const createQuickPick = vi.fn().mockImplementation(() => {
	let acceptCallback: (() => void) | undefined;
	let hideCallback: (() => void) | undefined;
	const qp = {
		dispose: vi.fn(),
		selectedItems: [],
		items: [],
		show: vi.fn(() => {
			setTimeout(() => {
				acceptCallback?.();
			}, 100);
		}),
		hide: vi.fn(() => {
			hideCallback?.();
		}),
		onDidChangeSelection: vi.fn(),
		onDidHide: vi.fn((cb) => {
			hideCallback = cb;
		}),
		onDidAccept: vi.fn((cb) => {
			acceptCallback = cb;
		}),
	};

	return qp;
});
export const onDidChangeActiveTextEditor = vi.fn();

// Env
export const openExternal = vi.fn();

// Languages
export const getLanguages = vi
	.fn()
	.mockResolvedValue(['python', 'css', 'javascript', 'typescript']);

// TreeItemCollapsibleState
export const None = 0;
export const Collapsed = 1;
export const Expanded = 2;

export default {
	EventEmitter: class {
		public fire = vi.fn();
	},
	window: {
		activeTextEditor: undefined,
		withProgress: vi.fn(),
		createStatusBarItem: vi.fn(),
		onDidChangeVisibleTextEditors: vi.fn(),
		setTextDocumentLanguage: vi.fn(),
		registerWebviewViewProvider: vi.fn(),
		createTreeView: vi.fn(),
		terminals: [],
	},
	languages: {
		registerCompletionItemProvider: vi.fn(),
		setTextDocumentLanguage: vi.fn(),
		getDiagnostics: vi.fn(),
	},
	workspace: {
		folders: [],
		workspaceFolders: [],
		fs: {
			writeFile: vi.fn(),
		},
		onDidChangeConfiguration: vi.fn(),
		onDidOpenTextDocument: vi.fn(),
		applyEdit: vi.fn(),
		onDidCloseTextDocument: vi.fn(() => {
			return { dispose: vi.fn() };
		}),
		registerFileSystemProvider: vi.fn(),
		registerTextDocumentContentProvider: vi.fn(),
	},
	env: {
		clipboard: { writeText: vi.fn() },
		appName: 'Visual Studio Code',
		appRoot: path.join('/Applications', 'VSCode', 'Contents'),
		openExternal: vi.fn(),
		machineId: 'TEST_MACHINE_ID',
	},
	StatusBarAlignment: { Right: 1 },
	FileChangeType: { Changed: 1, Created: 2, Deleted: 3 },
	FileType: { Unknown: 0, File: 1, Directory: 2 },
	WorkspaceEdit: class {
		replace = vi.fn();
	},
	ViewColumn: { Active: 1 },
	TextEditorRevealType: {},
	ProgressLocation: {},
	Location: class {},
	ConfigurationTarget: {},
	QuickPickItemKind: { Seperator: 0 },
	version: '1.109.0-insiders',
	MarkdownString,
};
