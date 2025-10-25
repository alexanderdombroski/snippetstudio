import { describe, it, expect, vi, beforeEach, afterEach, type Mock, afterAll } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { readJsonC } from './jsoncFilesIO';
import vscode, { showErrorMessage } from '../vscode';
import {
	getUserPath,
	_readGlobalStorage,
	initGlobalStore,
	_initUserPath,
	getExtensionContext,
} from './context';
import { context } from '../../.vitest/__mocks__/shared';

vi.mock('node:os', () => ({
	default: {
		homedir: vi.fn(),
	},
}));

vi.mock('./jsoncFilesIO', () => ({
	readJsonC: vi.fn(),
}));

describe('context', () => {
	const originalPlatform = process.platform;

	beforeEach(() => {
		vi.spyOn(os, 'homedir').mockReturnValue('/home/user');
		Object.defineProperty(process, 'platform', {
			value: 'darwin',
		});
	});

	afterEach(() => {
		Object.defineProperty(process, 'platform', {
			value: originalPlatform,
		});
		vi.restoreAllMocks();
	});

	describe('getUserPath', () => {
		afterAll(() => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Visual Studio Code' });
		});
		it('should return the correct path for win32', () => {
			Object.defineProperty(process, 'platform', {
				value: 'win32',
			});
			const expectedPath = path.join('/home/user', 'AppData', 'Roaming', 'Code', 'User');
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should return the correct path for linux', () => {
			Object.defineProperty(process, 'platform', {
				value: 'linux',
			});
			const expectedPath = path.join('/home/user', '.config', 'Code', 'User');
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should return the correct path for darwin', () => {
			const expectedPath = path.join(
				'/home/user',
				'Library',
				'Application Support',
				'Code',
				'User'
			);
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should throw an error for an unknown OS', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});
			expect(() => getUserPath()).toThrow("Unknown OS: Couldn't find user path");
		});

		it('should use insiders on nightly builds', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Visual Studio Code - Insiders' });
			const expectedPath = path.join(
				'/home/user',
				'Library',
				'Application Support',
				'Code - Insiders',
				'User'
			);
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should use VSCodium for complete OSS builds', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'VSCodium' });
			const expectedPath = path.join(
				'/home/user',
				'Library',
				'Application Support',
				'VSCodium',
				'User'
			);
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should use Cursor for AI Enjoyers', () => {
			Object.defineProperty(vscode.env, 'appName', { value: 'Cursor' });
			const expectedPath = path.join(
				'/home/user',
				'Library',
				'Application Support',
				'Cursor',
				'User'
			);
			expect(getUserPath()).toBe(expectedPath);
		});
	});

	describe('initUserPath', () => {
		it('should return user path if getUserPath is successful', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'darwin',
			});
			const expectedPath = path.join(
				'/home/user',
				'Library',
				'Application Support',
				'Code',
				'User'
			);
			const userPath = _initUserPath();
			expect(userPath).toBe(expectedPath);
		});

		it('should show error message if getUserPath throws an error', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});
			const userPath = _initUserPath();
			expect(showErrorMessage).toHaveBeenCalledWith(
				`Unsupported platform: sunos. Couldn't find default user path. Want to submit an issue to request support for your device?`,
				'Open GitHub Issue'
			);
			expect(userPath).toBeUndefined();
		});
	});

	describe('getExtensionContext', () => {
		it('should throw an error if context is not initialized', async () => {
			await expect(getExtensionContext()).rejects.toThrow(
				'Extension context not correctly initialized'
			);
		});

		it('should return the context after it has been initialized', async () => {
			(readJsonC as Mock).mockResolvedValue(undefined);

			await initGlobalStore(context);
			const savedContext = await getExtensionContext();
			expect(savedContext).toBe(context);
		});
	});

	describe('initGlobalStore', () => {
		it('should initialize context and return true if storage is read', async () => {
			const storage = {
				userDataProfiles: [{ name: 'test' }],
				profileAssociations: { '/root': 'test' },
			};
			(readJsonC as Mock).mockResolvedValue(storage);

			const result = await initGlobalStore(context);

			expect(context.globalState.update).toHaveBeenCalledWith('users', storage.userDataProfiles);
			expect(context.globalState.update).toHaveBeenCalledWith(
				'profileAssociations',
				storage.profileAssociations
			);
			expect(result).toBe(true);
		});

		it('should return false if storage is not found', async () => {
			(readJsonC as Mock).mockResolvedValue(undefined);

			const result = await initGlobalStore(context);

			expect(context.globalState.update).not.toHaveBeenCalled();
			expect(result).toBe(false);
		});
	});

	describe('readGlobalStorage', () => {
		it('should read global storage file from the correct path', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'darwin',
			});
			const userPath = _initUserPath();
			const expectedPath = path.join(userPath!, 'globalStorage', 'storage.json');
			const mockStorage = { userDataProfiles: [] };
			(readJsonC as Mock).mockResolvedValue(mockStorage);

			const result = await _readGlobalStorage();

			expect(readJsonC).toHaveBeenCalledWith(expectedPath);
			expect(result).toBe(mockStorage);
		});

		it('should return undefined if user path is not found', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});

			const result = await _readGlobalStorage();

			expect(readJsonC).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});
});
