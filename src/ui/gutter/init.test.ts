import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initGutterLoading } from './init';
import vscode from '../../vscode';
import { addGutterIcons } from './load';

vi.mock('./load');

describe('initGutterLoading', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
	});

	it('registers onDidChangeVisibleTextEditors listener', async () => {
		initGutterLoading();
		expect(vscode.window.onDidChangeVisibleTextEditors).toHaveBeenCalledTimes(1);
	});

	it('loads gutters for active editor if language is snippets', async () => {
		const editor = {
			document: { languageId: 'snippets' },
		};

		Object.defineProperty(vscode.window, 'activeTextEditor', { value: editor });

		initGutterLoading();
		await vi.dynamicImportSettled();

		expect(addGutterIcons).toHaveBeenCalledWith(editor);
	});

	it('does not load gutters for non-snippets language', async () => {
		const editor = {
			document: { languageId: 'typescript' },
		};

		Object.defineProperty(vscode.window, 'activeTextEditor', { value: editor });

		initGutterLoading();
		await vi.dynamicImportSettled();

		expect(addGutterIcons).not.toHaveBeenCalled();
	});
});
