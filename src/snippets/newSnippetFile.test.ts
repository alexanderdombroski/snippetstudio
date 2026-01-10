import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import {
	createFile,
	createLocalSnippetsFile,
	createGlobalLangFile,
	createGlobalSnippetsFile,
	exportSnippets,
	mergeSnippetFiles,
	renameSnippetFile,
} from './newSnippetFile';
import {
	showWarningMessage,
	showInformationMessage,
	showQuickPick,
	createQuickPick,
} from '../vscode';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exists, getWorkspaceFolder } from '../utils/fsInfo';
import { getCurrentLanguage } from '../utils/language';
import { getActiveProfileSnippetsDir } from '../utils/profile';
import { getFileName, getSavePath } from '../utils/user';
import {
	getLinkedSnippets,
	getLinkLocations,
	isSnippetLinked,
	updateAllSettings,
} from './links/config';
import { readJsoncFilesAsync, writeSnippetFile } from '../utils/jsoncFilesIO';
import { locateAllSnippetFiles } from './locateSnippets';
import type { VSCodeSnippets } from '../types';

vi.mock('../utils/fsInfo');
vi.mock('../utils/language');
vi.mock('../utils/jsoncFilesIO');
vi.mock('../utils/profile');
vi.mock('../utils/user');
vi.mock('./links/config');
vi.mock('./locateSnippets');

describe('newSnippetFile', () => {
	describe('createFile', () => {
		it('should show info if file exists', async () => {
			(exists as Mock).mockResolvedValue(true);
			await createFile('path');
			expect(showInformationMessage).toHaveBeenCalled();
		});

		it('should show warning if linked file exists', async () => {
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(true);
			const result = await createFile('path');
			expect(showWarningMessage).toHaveBeenCalled();
			expect(result).toBe('skipped');
		});

		it('should write new file', async () => {
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(false);
			await createFile('path/to/file');
			expect(fs.mkdir).toHaveBeenCalledWith('path/to', { recursive: true });
			expect(fs.writeFile).toHaveBeenCalledWith('path/to/file', '{}');
		});
	});

	describe('createLocalSnippetsFile', () => {
		it('should create local file', async () => {
			(getWorkspaceFolder as Mock).mockReturnValue('/workspace');
			(getFileName as Mock).mockResolvedValue('test');
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(false);
			await createLocalSnippetsFile();
			expect(fs.writeFile).toHaveBeenCalledWith(
				path.join('/workspace', '.vscode', 'test.code-snippets'),
				'{}'
			);
		});
	});

	describe('createGlobalLangFile', () => {
		it('should create global language file', async () => {
			(getCurrentLanguage as Mock).mockReturnValue('typescript');
			(getActiveProfileSnippetsDir as Mock).mockResolvedValue('/global');
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(false);
			await createGlobalLangFile();
			expect(fs.writeFile).toHaveBeenCalledWith(path.join('/global', 'typescript.json'), '{}');
		});
	});

	describe('createGlobalSnippetsFile', () => {
		it('should create global snippets file', async () => {
			(getActiveProfileSnippetsDir as Mock).mockResolvedValue('/global');
			(getFileName as Mock).mockResolvedValue('test');
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(false);
			await createGlobalSnippetsFile();
			expect(fs.writeFile).toHaveBeenCalledWith(path.join('/global', 'test.code-snippets'), '{}');
		});
	});

	describe('mergeSnippetFiles', async () => {
		it('should show a warning if you have no snippet files', async () => {
			(locateAllSnippetFiles as Mock).mockReturnValue([[], [], {}]);
			await mergeSnippetFiles();

			expect(showWarningMessage).toBeCalledWith(expect.stringContaining('no snippets'));
		});
		it('should merge snippet files into one', async () => {
			const fp = 'snippet1.json';
			const snippets: VSCodeSnippets = {
				log: { prefix: 'log', body: 'console.log' },
				info: { prefix: ['info', 'logi'], body: 'console.info' },
			};

			(locateAllSnippetFiles as Mock).mockReturnValue([[fp], [], {}]);
			(showQuickPick as Mock).mockImplementation((obj) => obj);
			(readJsoncFilesAsync as Mock).mockResolvedValue([[fp, snippets]]);

			const qpMock = (createQuickPick as Mock).getMockImplementation();
			(createQuickPick as Mock).mockImplementationOnce(() => {
				const qp = qpMock?.();
				qp.selectedItems = Object.keys(snippets).map((k) => ({ label: k }));
				return qp;
			});

			const merged = await mergeSnippetFiles();

			expect(merged).toStrictEqual(snippets);
		});
	});

	describe('exportSnippets', () => {
		it('should end the command early if user dismisses quickpicks', async () => {
			(getSavePath as Mock).mockReturnValue(undefined);
			await exportSnippets();

			(getSavePath as Mock).mockReturnValue('/real/path');
			(locateAllSnippetFiles as Mock).mockReturnValue([['snippet.json'], [], []]);
			(showQuickPick as Mock).mockReturnValue(undefined);
			await exportSnippets();

			expect(writeSnippetFile).not.toBeCalled();
		});
	});

	describe('renameSnippetFile', () => {
		const fp = '/example/test.code-snippets';

		beforeEach(() => {
			vi.clearAllMocks();
			(getFileName as Mock).mockReturnValue('new');
			(exists as Mock).mockResolvedValue(false);
			(isSnippetLinked as Mock).mockResolvedValue(false);
		});

		it('should exit early with no filename', async () => {
			(getFileName as Mock).mockReturnValue(undefined);
			await renameSnippetFile(fp);
			expect(fs.rename).not.toBeCalled();
		});

		it('should exit early if not safe to rename', async () => {
			(exists as Mock).mockResolvedValue(true);
			await renameSnippetFile(fp);
			expect(showWarningMessage).toBeCalled();
			expect(fs.rename).not.toBeCalled();
		});

		it('should rename the file', async () => {
			await renameSnippetFile(fp);
			expect(fs.rename).toBeCalled();
			expect(showInformationMessage).toBeCalled();
		});

		it('should warn if there would be a link override', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(true);
			(getLinkedSnippets as Mock).mockResolvedValue({ 'new.code-snippets': ['/example/path'] });

			await renameSnippetFile(fp);
			expect(fs.rename).not.toBeCalled();
			expect(showWarningMessage).toBeCalled();
		});

		it('should rename all linked files and update settings', async () => {
			(isSnippetLinked as Mock).mockResolvedValue(true);
			(getLinkedSnippets as Mock).mockResolvedValue({ 'test.code-snippets': ['/example/path'] });
			(getLinkLocations as Mock).mockResolvedValue(['/example/path']);

			await renameSnippetFile(fp);
			expect(fs.rename).toBeCalled();
			expect(showInformationMessage).toBeCalled();
			expect(updateAllSettings).toBeCalled();
		});
	});
});
