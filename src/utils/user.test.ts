import type { TextEditor } from 'vscode';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	chooseLocalGlobal,
	getConfirmation,
	getFileName,
	getSavePath,
	getSavePathFromDialog,
	getSelection,
} from './user';
import { getActiveProfileSnippetsDir } from './profile';
import { getDownloadsDirPath, getWorkspaceFolder } from './fsInfo';
import { unTabMultiline } from './string';
import path from 'node:path';
import vscode, {
	getConfiguration,
	showErrorMessage,
	showInformationMessage,
	showInputBox,
	showQuickPick,
	Uri,
	showSaveDialog,
} from '../vscode';

vi.mock('./profile');
vi.mock('./fsInfo');
vi.mock('./string');

afterEach(() => {
	vi.restoreAllMocks();
});

describe('user', () => {
	describe('getConfirmation', () => {
		it('should return true when user selects "Yes"', async () => {
			vi.mocked(showInformationMessage).mockResolvedValue('Yes' as any);
			const result = await getConfirmation('Are you sure?');
			expect(showInformationMessage).toHaveBeenCalledWith(
				'Are you sure?',
				{ modal: true },
				'Yes',
				'No'
			);
			expect(result).toBe(true);
		});

		it('should return false when user selects "No"', async () => {
			vi.mocked(showInformationMessage).mockResolvedValue('No' as any);
			const result = await getConfirmation('Are you sure?');
			expect(result).toBe(false);
		});

		it('should return false when user closes the dialog', async () => {
			vi.mocked(showInformationMessage).mockResolvedValue(undefined);
			const result = await getConfirmation('Are you sure?');
			expect(result).toBe(false);
		});
	});

	describe('getSelection', () => {
		it('should return undefined if there is no active editor', async () => {
			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue(undefined);

			const result = await getSelection();
			expect(result).toBeUndefined();
		});

		it('should return undefined if selection is empty', async () => {
			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
				selection: { isEmpty: true },
			} as TextEditor);

			const result = await getSelection();
			expect(result).toBeUndefined();
		});

		it('should return selected text without untabbing when cleanupSnippetSelection is false', async () => {
			const getText = vi.fn().mockReturnValue('  some text');
			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue({
				selection: { isEmpty: false },
				document: { getText },
			} as unknown as TextEditor);

			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn().mockReturnValue(false),
			} as any);

			const result = await getSelection();

			expect(result).toBe('  some text');
			expect(unTabMultiline).not.toHaveBeenCalled();
		});

		it('should return selected text with untabbing when cleanupSnippetSelection is true', async () => {
			const getText = vi.fn();
			const editor = {
				selection: {
					isEmpty: false,
				},
				document: {
					getText,
				},
			};
			Object.defineProperty(vscode.window, 'activeTextEditor', {
				value: editor,
			});
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn().mockReturnValue(true),
			} as any);
			vi.mocked(unTabMultiline).mockResolvedValue('some text');

			const result = await getSelection();

			expect(unTabMultiline).toHaveBeenCalledWith(editor.selection, editor);
			expect(result).toBe('some text');
		});
	});

	describe('getSavePathFromDialog', () => {
		it('should return the selected file path', async () => {
			const expectedPath = '/path/to/save/file.txt';
			vi.mocked(showSaveDialog).mockResolvedValue({
				fsPath: expectedPath,
			} as any);
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads');

			const result = await getSavePathFromDialog('file.txt');

			expect(showSaveDialog).toHaveBeenCalledWith({
				title: 'Save file.txt',
				defaultUri: Uri.file(path.join('/downloads', 'file.txt')),
				saveLabel: 'Save',
			});
			expect(result).toBe(expectedPath);
		});

		it('should return undefined if dialog is cancelled', async () => {
			vi.mocked(showSaveDialog).mockResolvedValue(undefined);
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads');

			const result = await getSavePathFromDialog('file.txt');

			expect(result).toBeUndefined();
		});
	});

	describe('getFileName', () => {
		it('should return a valid filename', async () => {
			vi.mocked(showInputBox).mockResolvedValue(' my-file-name ');
			const result = await getFileName();
			expect(result).toBe('my-file-name');
		});

		it('should return undefined if input is cancelled', async () => {
			vi.mocked(showInputBox).mockResolvedValue(undefined);
			const result = await getFileName();
			expect(showInformationMessage).toHaveBeenCalledWith('Skipped file creation.');
			expect(result).toBeUndefined();
		});

		it('should show error for invalid filename and return undefined', async () => {
			vi.mocked(showInputBox).mockResolvedValue('invalid name!');
			const result = await getFileName();
			expect(showErrorMessage).toHaveBeenCalledWith(
				'Only use characters, hyphens, numbers and/or underscores.'
			);
			expect(result).toBeUndefined();
		});

		it('should not show message if silent is true', async () => {
			vi.mocked(showInputBox).mockResolvedValue(undefined);
			await getFileName('prompt', true);
			expect(showInformationMessage).not.toHaveBeenCalled();
		});
	});

	describe('getSavePath', () => {
		beforeEach(() => {
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads');
		});

		it('should return undefined if getFileName returns undefined', async () => {
			vi.mocked(showInputBox).mockResolvedValue(undefined);
			const result = await getSavePath();
			expect(result).toBeUndefined();
		});

		it('should use save dialog when export.location is "choose"', async () => {
			vi.mocked(showInputBox).mockResolvedValue('test-file');
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn().mockReturnValue('choose'),
			} as any);
			const expectedPath = '/chosen/path/test-file.code-snippets';
			vi.mocked(showSaveDialog).mockResolvedValue({
				fsPath: expectedPath,
			} as any);

			const result = await getSavePath();
			expect(showSaveDialog).toHaveBeenCalled();
			expect(result).toBe(expectedPath);
		});

		it('should use downloads path when export.location is "downloads"', async () => {
			vi.mocked(showInputBox).mockResolvedValue('test-file');
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn().mockReturnValue('downloads'),
			} as any);
			const result = await getSavePath();
			expect(result).toBe(path.join('/downloads', 'test-file.code-snippets'));
		});

		it('should use preconfigured path when export.location is "preconfigured"', async () => {
			vi.mocked(showInputBox).mockResolvedValue('test-file');
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn((key: string) => {
					if (key === 'export.location') {
						return 'preconfigured';
					}
					if (key === 'export.preconfiguredExportPath') {
						return '/preconfigured/path';
					}
				}),
			} as any);
			const result = await getSavePath();
			expect(result).toBe('/preconfigured/path/test-file.code-snippets');
		});

		it('should show error if preconfigured path is not set', async () => {
			vi.mocked(showInputBox).mockResolvedValue('test-file');
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn((key: string) => {
					if (key === 'export.location') {
						return 'preconfigured';
					}
					if (key === 'export.preconfiguredExportPath') {
						return undefined;
					}
				}),
			} as any);
			const result = await getSavePath();
			expect(showErrorMessage).toHaveBeenCalledWith(
				'In settings, you must specificy a folder path to save exported snippets to'
			);
			expect(result).toBeUndefined();
		});

		it('should return undefined for default case in switch', async () => {
			vi.mocked(showInputBox).mockResolvedValue('test-file');
			vi.mocked(getConfiguration).mockReturnValue({
				get: vi.fn().mockReturnValue('unknown-location'),
			} as any);
			const result = await getSavePath();
			expect(result).toBeUndefined();
		});
	});

	describe('chooseLocalGlobal', () => {
		it('should show quick pick with Downloads and Global locations', async () => {
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads/path');
			vi.mocked(getActiveProfileSnippetsDir).mockResolvedValue('/global/snippets');
			vi.mocked(getWorkspaceFolder).mockReturnValue(undefined);
			vi.mocked(showQuickPick).mockResolvedValue({
				label: 'Global',
				description: '/global/snippets',
			} as any);

			const result = await chooseLocalGlobal();

			expect(showQuickPick).toHaveBeenCalledWith([
				{ label: 'Downloads', description: '/downloads/path' },
				{ label: 'Global', description: '/global/snippets' },
			]);
			expect(result).toBe('/global/snippets');
		});

		it('should also include Project location if workspace folder exists', async () => {
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads/path');
			vi.mocked(getActiveProfileSnippetsDir).mockResolvedValue('/global/snippets');
			vi.mocked(getWorkspaceFolder).mockReturnValue('/project/path');
			vi.mocked(showQuickPick).mockResolvedValue({
				label: 'Project',
				description: path.join('/project/path', '.vscode'),
			} as any);

			const result = await chooseLocalGlobal();

			expect(showQuickPick).toHaveBeenCalledWith([
				{ label: 'Downloads', description: '/downloads/path' },
				{ label: 'Global', description: '/global/snippets' },
				{
					label: 'Project',
					description: path.join('/project/path', '.vscode'),
				},
			]);
			expect(result).toBe(path.join('/project/path', '.vscode'));
		});

		it('should return undefined if no choice is made', async () => {
			vi.mocked(getDownloadsDirPath).mockReturnValue('/downloads/path');
			vi.mocked(getActiveProfileSnippetsDir).mockResolvedValue('/global/snippets');
			vi.mocked(getWorkspaceFolder).mockReturnValue(undefined);
			vi.mocked(showQuickPick).mockResolvedValue(undefined);

			const result = await chooseLocalGlobal();

			expect(result).toBeUndefined();
		});
	});
});
