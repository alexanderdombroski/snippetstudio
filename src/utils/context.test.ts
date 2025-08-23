import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import type { ExtensionContext } from 'vscode';
import { readJsonC } from './jsoncFilesIO';
import { showErrorMessage } from '../vscode';
import {
	getUserPath,
	readGlobalStorage,
	initGlobalStore,
	initUserPath,
	getExtensionContext,
} from './context';
import type { GenericJson, JSONObject } from '../types';

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
	});

	afterEach(() => {
		Object.defineProperty(process, 'platform', {
			value: originalPlatform,
		});
		vi.restoreAllMocks();
	});

	describe('getUserPath', () => {
		it('should return the correct path for win32', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'win32',
			});
			const expectedPath = path.join('/home/user', 'AppData', 'Roaming', 'Code', 'User');
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should return the correct path for linux', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'linux',
			});
			const expectedPath = path.join('/home/user', '.config', 'Code', 'User');
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should return the correct path for darwin', async () => {
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
			expect(getUserPath()).toBe(expectedPath);
		});

		it('should throw an error for an unknown OS', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});
			expect(() => getUserPath()).toThrow("Unknown OS: Couldn't find user path");
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
			const userPath = initUserPath();
			expect(userPath).toBe(expectedPath);
		});

		it('should show error message if getUserPath throws an error', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});
			const userPath = initUserPath();
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
			vi.mocked(readJsonC).mockResolvedValue(undefined as unknown as GenericJson);
			const mockContext = {
				globalState: { update: vi.fn(), get: vi.fn() },
			} as unknown as ExtensionContext;

			await initGlobalStore(mockContext);
			const context = await getExtensionContext();
			expect(context).toBe(mockContext);
		});
	});

	describe('initGlobalStore', () => {
		const mockContext = {
			globalState: {
				update: vi.fn(),
				get: vi.fn(),
			},
		} as unknown as ExtensionContext;

		it('should initialize context and return true if storage is read', async () => {
			const storage = {
				userDataProfiles: [{ name: 'test' }],
				profileAssociations: { '/root': 'test' },
			};
			vi.mocked(readJsonC).mockResolvedValue(storage as GenericJson);

			const result = await initGlobalStore(mockContext);

			expect(mockContext.globalState.update).toHaveBeenCalledWith(
				'users',
				storage.userDataProfiles
			);
			expect(mockContext.globalState.update).toHaveBeenCalledWith(
				'profileAssociations',
				storage.profileAssociations
			);
			expect(result).toBe(true);
		});

		it('should return false if storage is not found', async () => {
			vi.mocked(readJsonC).mockResolvedValue(undefined as unknown as GenericJson);

			const result = await initGlobalStore(mockContext);

			expect(mockContext.globalState.update).not.toHaveBeenCalled();
			expect(result).toBe(false);
		});
	});

	describe('readGlobalStorage', () => {
		it('should read global storage file from the correct path', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'darwin',
			});
			const userPath = initUserPath();
			const expectedPath = path.join(userPath!, 'globalStorage', 'storage.json');
			const mockStorage = { userDataProfiles: [] };
			vi.mocked(readJsonC).mockResolvedValue(mockStorage as JSONObject);

			const result = await readGlobalStorage();

			expect(readJsonC).toHaveBeenCalledWith(expectedPath);
			expect(result).toBe(mockStorage);
		});

		it('should return undefined if user path is not found', async () => {
			Object.defineProperty(process, 'platform', {
				value: 'sunos',
			});

			const result = await readGlobalStorage();

			expect(readJsonC).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});
	});
});
