// Move mocks you want to import in here
import type { ExtensionContext, Disposable } from 'vscode';
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
