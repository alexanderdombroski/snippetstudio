import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SnippetDataWebViewProvider from './SnippetDataWebViewProvider';
import SnippetDataManager from './SnippetDataManager';
import type { WebviewView, Webview } from 'vscode';
import { executeCommand } from '../../vscode';
import fs from 'node:fs/promises';
import { getCurrentUri } from '../../utils/fsInfo';
import type { Mock, Mocked } from 'vitest';
import type { Uri } from 'vscode';
import { context } from '../../../.vitest/__mocks__/shared';

vi.mock('../../utils/fsInfo');

describe('SnippetDataWebViewProvider', () => {
	let provider: SnippetDataWebViewProvider;
	let dataManager: SnippetDataManager;
	let mockWebviewView: Mocked<WebviewView>;
	let mockWebview: Mocked<Webview>;

	const testUri = {
		scheme: 'snippetstudio',
		path: '/snippets/test.code-snippets',
		query: 'showScope=true',
	} as Uri;

	beforeEach(() => {
		dataManager = new SnippetDataManager();
		provider = new SnippetDataWebViewProvider(context, dataManager);

		mockWebview = {
			options: {},
			html: '',
			onDidReceiveMessage: vi.fn(),
			postMessage: vi.fn(),
		} as any;

		mockWebviewView = {
			webview: mockWebview,
			onDidChangeVisibility: vi.fn(),
			visible: true,
		} as any;

		(getCurrentUri as Mock).mockReturnValue(testUri);
		(fs.readFile as Mock).mockResolvedValue('<html></html>');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should be created', () => {
		expect(provider).toBeDefined();
	});

	describe('Message Handling', () => {
		let messageCallback: (message: any) => void;

		beforeEach(async () => {
			mockWebview.onDidReceiveMessage.mockImplementation((cb) => {
				messageCallback = cb;
				return { dispose: vi.fn() };
			});
			await provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
		});

		it('should handle updateSnippetData message', () => {
			const snippetData = { prefix: 'test', scope: 'ts', description: 'desc' };
			vi.spyOn(dataManager, 'setData');
			messageCallback({ command: 'updateSnippetData', data: snippetData });

			expect(dataManager.setData).toHaveBeenCalledWith(testUri.path, snippetData);
			expect(executeCommand).toHaveBeenCalledWith('snippetstudio.editor.save');
		});

		it('should handle updatePartialSnippetData message', () => {
			const partialData = { data: 'new-prefix', type: 'prefix' };
			vi.spyOn(dataManager, 'setPartialData');
			messageCallback({ command: 'updatePartialSnippetData', data: partialData });

			expect(dataManager.setPartialData).toHaveBeenCalledWith(
				testUri.path,
				partialData.type,
				partialData.data
			);
		});

		it('should warn on unknown command', () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			messageCallback({ command: 'unknown' });
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'Unknown message passed to snippetData Form WebView unknown'
			);
			consoleWarnSpy.mockRestore();
		});
	});

	describe('initMessages', () => {
		beforeEach(async () => {
			await provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
		});

		it('should post filterFields message', () => {
			provider.initMessages(testUri);
			expect(mockWebview.postMessage).toHaveBeenCalledWith({
				command: 'filterFields',
				showScope: true,
				showGlob: true,
			});
		});

		it('should post initForm message if data exists', () => {
			const snippetData = { prefix: 'test' };
			vi.spyOn(dataManager, 'hasKey').mockReturnValue(true);
			vi.spyOn(dataManager, 'getData').mockReturnValue(snippetData as any);

			provider.initMessages(testUri);

			expect(mockWebview.postMessage).toHaveBeenCalledWith({
				command: 'initForm',
				data: snippetData,
			});
		});

		it('should not post initForm message if data does not exist', () => {
			vi.spyOn(dataManager, 'hasKey').mockReturnValue(false);
			provider.initMessages(testUri);
			expect(mockWebview.postMessage).not.toHaveBeenCalledWith(
				expect.objectContaining({ command: 'initForm' })
			);
		});
	});
});
