// __mocks__/vscode.ts
import { vi } from 'vitest';

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
};
export const SnippetString = class {};
export const CompletionItem = class {};
export const MarkdownString = class {};
export const ThemeIcon = class {
	iconPath: string;

	constructor(iconPath: string) {
		this.iconPath = iconPath;
	}

	toString(): string {
		return this.iconPath;
	}
};
export const Range = class {};
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
});
export const openTextDocument = vi.fn();

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
export const showTextDocument = vi.fn();
export const createTerminal = vi.fn().mockReturnValue({
	show: vi.fn(),
	sendText: vi.fn(),
});
export const showOpenDialog = vi.fn();
export const showSaveDialog = vi.fn();
export const createQuickPick = vi.fn().mockReturnValue({
	items: [],
	show: vi.fn(),
	onDidChangeSelection: vi.fn(),
});
export const onDidChangeActiveTextEditor = vi.fn();

// Env
export const openExternal = vi.fn();

// TreeItemCollapsibleState
export const None = 0;
export const Collapsed = 1;
export const Expanded = 2;

export default {
	EventEmitter: class {
		public fire = vi.fn();
	},
	window: {
		activeTextEditor: vi.fn(),
		withProgress: vi.fn(),
		createStatusBarItem: vi.fn(),
		createTextEditorDecorationType: vi.fn(),
	},
	languages: { getLanguages: vi.fn(() => ['python', 'css', 'javascript', 'typescript']) },
	workspace: {
		folders: [],
		workspaceFolders: [],
		fs: {
			writeFile: vi.fn(),
		},
		onDidChangeConfiguration: vi.fn(),
		applyEdit: vi.fn(),
	},
	env: { clipboard: { writeText: vi.fn() } },
	StatusBarAlignment: { Right: 1 },
	FileChangeType: { Changed: 1, Created: 2, Deleted: 3 },
	FileType: { Unknown: 0, File: 1, Directory: 2 },
	WorkspaceEdit: class {
		replace = vi.fn();
	},
};
