import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock, Mocked } from 'vitest';
import type { Uri, StatusBarItem, TextEditor } from 'vscode';
import { getCurrentUri } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';
import { capitalize } from '../utils/string';
import vscode, { getConfiguration, onDidChangeActiveTextEditor } from '../vscode';
import { createStatusBar } from './statusBar';
import { context } from '../../.vitest/__mocks__/shared';

vi.mock('../utils/language');
vi.mock('../utils/fsInfo');
vi.mock('../utils/string');

describe('ui/statusBar', () => {
	let statusBarItem: Mocked<StatusBarItem>;
	let onDidChangeActiveTextEditorCallback: (editor: TextEditor | undefined) => any;

	beforeEach(() => {
		statusBarItem = {
			show: vi.fn(),
			dispose: vi.fn(),
			text: '',
			tooltip: '',
			command: '',
		} as unknown as Mocked<StatusBarItem>;

		(vscode.window.createStatusBarItem as Mock).mockReturnValue(statusBarItem);

		const getMock = vi.fn((key: string, defaultValue?: any) => {
			if (key === 'statusBar.priority') {
				return 30;
			}
			if (key === 'statusBar.showLanguage') {
				return true;
			}
			return defaultValue;
		});
		(getConfiguration as Mock).mockReturnValue({ get: getMock });

		(onDidChangeActiveTextEditor as Mock).mockImplementation((callback) => {
			onDidChangeActiveTextEditorCallback = callback;
			return { dispose: vi.fn() };
		});

		(getCurrentLanguage as Mock).mockReturnValue('typescript');
		(getCurrentUri as Mock).mockReturnValue(undefined);
		(capitalize as Mock).mockImplementation((s) => s.charAt(0).toUpperCase() + s.slice(1));
	});

	it('should create and initialize the status bar item', () => {
		vi.spyOn(context.subscriptions, 'push');
		createStatusBar(context);

		expect(getConfiguration).toHaveBeenCalledWith('snippetstudio');
		expect(vscode.window.createStatusBarItem).toHaveBeenCalled();
		expect(statusBarItem.command).toBe('snippetstudio.snippet.addGlobal');
		expect(statusBarItem.tooltip).toBe('Press to create new Snippet');
		expect(statusBarItem.show).toHaveBeenCalled();
		expect(context.subscriptions.push).toHaveBeenCalledWith(statusBarItem);
	});

	it('should update status bar text on initialization', () => {
		createStatusBar(context);
		expect(statusBarItem.text).toBe('$(repo)  Typescript');
	});

	it('should update status bar text when active editor changes', () => {
		createStatusBar(context);

		expect(statusBarItem.text).toBe('$(repo)  Typescript');

		(getCurrentLanguage as Mock).mockReturnValue('javascript');
		onDidChangeActiveTextEditorCallback(undefined);
		expect(statusBarItem.text).toBe('$(repo)  Javascript');
	});

	it('should show database icon for snippets language', () => {
		(getCurrentLanguage as Mock).mockReturnValue('snippets');
		createStatusBar(context);
		expect(statusBarItem.text).toBe('$(database)  Snippets');
	});

	it('should show book icon for snippetstudio scheme', () => {
		(getCurrentUri as Mock).mockReturnValue({ scheme: 'snippetstudio' } as Uri);
		createStatusBar(context);
		expect(statusBarItem.text).toBe('$(book)  Typescript');
	});

	it('should not show language if disabled in settings', () => {
		(getConfiguration as Mock).mockReturnValue({
			get: vi.fn((key: string) => {
				if (key === 'statusBar.showLanguage') {
					return false;
				}
				return 30;
			}),
		});

		createStatusBar(context);
		expect(statusBarItem.text).toBe('$(repo)');
	});
});
