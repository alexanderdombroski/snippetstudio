// __mocks__/vscode.ts
import { vi } from 'vitest';

// Basic classes and constructors
export const Uri = {
	file: (path: string) => ({ fsPath: path }), // minimal Uri mock
	parse: vi.fn(),
};
export const SnippetString = class {};
export const CompletionItem = class {};
export const MarkdownString = class {};
export const ThemeIcon = class {};
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
export const TextEditor = class {
	document: {
		getText: ReturnType<typeof vi.fn>;
		lineAt: (line: number) => { range: { end: Position } };
	};
	constructor(text = '') {
		this.document = {
			// getText returns a string so split() works
			getText: vi.fn(() => text),
			// lineAt returns an object with range.end as a Position
			lineAt: vi.fn((line: number) => ({ range: { end: new Position(line) } })),
		};
	}
};

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

export class TreeItem {
	label: string;
	collapsibleState?: number;
	iconPath?: string | { light: string; dark: string };
	command?: { command: string; title: string; arguments?: any[] };

	constructor(label: string, collapsibleState?: number) {
		this.label = label;
		this.collapsibleState = collapsibleState;
	}
}

// TreeItemCollapsibleState
export const None = 0;
export const Collapsed = 1;
export const Expanded = 2;

export default {
	window: { activeTextEditor: TextEditor },
	languages: { getLanguages: vi.fn(() => ['python', 'css', 'javascript', 'typescript']) },
	workspace: {
		folders: [],
		workspaceFolders: [],
		fs: {
			writeFile: vi.fn(),
		},
	},
	env: { clipboard: { writeText: vi.fn() } },
};
