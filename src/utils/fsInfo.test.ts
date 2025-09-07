import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import type { WorkspaceFolder, TextDocument, TextEditor } from 'vscode';
import vscode, { Uri } from '../vscode';
import {
	getWorkspaceFolder,
	getCurrentUri,
	shortenFullPath,
	getDownloadsDirPath,
	isParentDir,
	exists,
} from './fsInfo';

// Mock dependencies
vi.mock('node:os', () => ({
	default: {
		homedir: vi.fn(),
	},
}));

describe('fsInfo', () => {
	describe('getWorkspaceFolder', () => {
		it('should return undefined if no workspace folders are open', () => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue(undefined);
			expect(getWorkspaceFolder()).toBeUndefined();

			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([]);
			expect(getWorkspaceFolder()).toBeUndefined();
		});

		it('should return the path of the first workspace folder', () => {
			const folderPath = '/test/workspace';
			const mockFolders: WorkspaceFolder[] = [
				{ uri: Uri.file(folderPath), name: 'mock-folder', index: 0 },
			];

			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue(mockFolders);
			expect(getWorkspaceFolder()).toBe(folderPath);
		});
	});

	describe('getCurrentUri', () => {
		it('should return undefined if there is no active text editor', () => {
			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue(undefined);
			expect(getCurrentUri()).toBeUndefined();
		});

		it('should return the URI of the active text editor document', () => {
			const uri = Uri.file('/test/file.txt'); // proper Uri
			const mockDocument: Partial<TextDocument> = {
				uri,
			};

			const mockEditor: Partial<TextEditor> = {
				document: mockDocument as TextDocument,
			};

			vi.spyOn(vscode.window, 'activeTextEditor', 'get').mockReturnValue(mockEditor as TextEditor);

			expect(getCurrentUri()).toBe(uri);
		});
	});

	describe('shortenFullPath', () => {
		it('should shorten the path if it is inside the home directory', () => {
			const homeDir = '/Users/testuser';
			const fullPath = '/Users/testuser/some/path/file.txt';
			vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
			expect(shortenFullPath(fullPath)).toBe('~/some/path/file.txt');
		});

		it('should not shorten the path if it is not inside the home directory', () => {
			const homeDir = '/Users/testuser';
			const fullPath = '/another/path/file.txt';
			vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
			expect(shortenFullPath(fullPath)).toBe(fullPath);
		});

		it('should handle root path correctly', () => {
			const homeDir = '/Users/testuser';
			const fullPath = '/';
			vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
			expect(shortenFullPath(fullPath)).toBe('/');
		});
	});

	describe('getDownloadsDirPath', () => {
		it('should return the downloads directory path', () => {
			const homeDir = '/Users/testuser';
			vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
			expect(getDownloadsDirPath()).toBe(path.join(homeDir, 'Downloads'));
		});
	});

	describe('isParentDir', () => {
		it('should return true if the child path is inside the parent directory', () => {
			const parent = '/a/b';
			const child = '/a/b/c';
			expect(isParentDir(parent, child)).toBe(true);
		});

		it('should return false if the child path is not inside the parent directory', () => {
			const parent = '/a/b';
			const child = '/a/c/d';
			expect(isParentDir(parent, child)).toBe(false);
		});

		it('should return false if the paths are the same', () => {
			const parent = '/a/b';
			const child = '/a/b';
			expect(isParentDir(parent, child)).toBe(false);
		});

		it('should return false for relative paths going up', () => {
			const parent = '/a/b';
			const child = '/a/b/../c';
			expect(isParentDir(parent, child)).toBe(false);
		});

		it('should return false for a child that is a parent of parent', () => {
			const parent = '/a/b/c';
			const child = '/a/b';
			expect(isParentDir(parent, child)).toBe(false);
		});
	});

	describe('exists', () => {
		it('should return true if fs.access resolves', async () => {
			vi.spyOn(fs, 'access').mockResolvedValue(undefined);
			await expect(exists('/any/path')).resolves.toBe(true);
		});

		it('should return false if fs.access rejects', async () => {
			vi.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
			await expect(exists('/any/path')).resolves.toBe(false);
		});
	});
});
