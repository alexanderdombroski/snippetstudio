// Move mocks you want to import in here
import type {
	ExtensionContext,
	Disposable,
	TreeItem as TreeViewItem,
	Uri,
	MarkdownString,
	TreeItemCollapsibleState,
	Command,
	AccessibilityInformation,
} from 'vscode';
import { vi, type Mocked } from 'vitest';
import { Position } from './vscode';

const disposableMock: Disposable = { dispose: vi.fn() };

export const context = {
	secrets: {
		get: vi.fn(async (key: string) => process.env[key]),
		store: vi.fn(),
		delete: vi.fn(),
		onDidChange: { event: vi.fn() } as any,
	},
	subscriptions: [disposableMock],
	globalState: {
		get: vi.fn(),
		keys: vi.fn(),
		update: vi.fn(),
		setKeysForSync: vi.fn(),
	},
} as Mocked<Partial<ExtensionContext>> as Mocked<ExtensionContext>;

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

export class TreeItem implements TreeViewItem {
	// Core properties
	label: string;
	id?: string;
	iconPath?: string | Uri;
	description?: string;
	tooltip?: string | MarkdownString;
	collapsibleState: TreeItemCollapsibleState | number;
	contextValue?: string;
	command?: Command;
	resourceUri?: Uri;
	accessibilityInformation?: AccessibilityInformation;
	path?: string;

	constructor(label: string, collapsibleState: TreeItemCollapsibleState = 0) {
		this.label = label;
		this.collapsibleState = collapsibleState;
	}
}
