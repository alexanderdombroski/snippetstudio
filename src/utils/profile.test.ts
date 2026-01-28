import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import path from 'node:path';
import type { ProfileInfo, ProfileAssociations } from '../types';
import {
	getActiveProfile,
	getAllGlobalSnippetDirs,
	getPathFromProfileLocation,
	getProfileIdFromPath,
	getProfiles,
	getActiveProfilePath,
	getActiveProfileSnippetsDir,
	getGlobalLangFile,
} from './profile';
import { getExtensionContext, getUserPath } from './context';
import vscode from '../vscode';
import { context } from '../../.vitest/__mocks__/shared';
import type { Uri } from 'vscode';

vi.mock('./context');

describe('profile utils', () => {
	const mockUserPath =
		process.platform === 'win32'
			? 'C:\\Users\\test\\AppData\\Roaming\\Code\\User'
			: '/Users/test/Library/Application Support/Code/User';

	beforeEach(() => {
		(getUserPath as Mock).mockReturnValue(mockUserPath);
		(getExtensionContext as Mock).mockReturnValue(context);
	});

	describe('getPathFromProfileLocation', () => {
		it('should return the correct path for the default profile', () => {
			const location = '__default__profile__';
			const expectedPath = path.join(mockUserPath, 'snippets');
			expect(getPathFromProfileLocation(location)).toBe(expectedPath);
		});

		it('should return the correct path for a custom profile', () => {
			const location = 'my-profile-hash';
			const expectedPath = path.join(mockUserPath, 'profiles', location, 'snippets');
			expect(getPathFromProfileLocation(location)).toBe(expectedPath);
		});
	});

	describe('getProfileIdFromPath', () => {
		it('should extract the profile id from a custom profile path', () => {
			const filePath = path.join(
				mockUserPath,
				'profiles',
				'my-profile-hash',
				'snippets',
				'test.json'
			);
			expect(getProfileIdFromPath(filePath)).toBe('my-profile-hash');
		});

		it('should return the default profile id from a default profile path', () => {
			const filePath = path.join(mockUserPath, 'snippets', 'test.json');
			expect(getProfileIdFromPath(filePath)).toBe('__default__profile__');
		});

		it('should throw an error for an invalid path', () => {
			const invalidPath = '/invalid/path/without/profile/info';
			expect(() => getProfileIdFromPath(invalidPath)).toThrow('Invalid snippet path');
		});
	});

	describe('getProfiles', () => {
		it('should return profiles from global state plus the default profile', async () => {
			const mockProfiles: ProfileInfo[] = [{ location: '123', name: 'Test Profile' }];
			(context.globalState.get as Mock).mockReturnValue(mockProfiles);

			const profiles = await getProfiles();
			expect(profiles).toHaveLength(2);
			expect(profiles).toContainEqual({ location: '123', name: 'Test Profile' });
			expect(profiles).toContainEqual({ location: '__default__profile__', name: 'Default' });
		});

		it('should return only the default profile if global state is empty', async () => {
			(context.globalState.get as Mock).mockReturnValue(undefined);

			const profiles = await getProfiles();
			expect(profiles).toHaveLength(1);
			expect(profiles).toContainEqual({ location: '__default__profile__', name: 'Default' });
		});
	});

	describe('getActiveProfile', () => {
		const mockProfiles: ProfileInfo[] = [{ location: '123', name: 'Work' }];
		const mockWorkspaceUri = 'file:///path/to/workspace';
		beforeEach(() => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
				{ uri: { toString: () => mockWorkspaceUri } as Uri, name: 'Work', index: 0 },
			]);
		});

		it('should return the profile associated with the current workspace', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {
					[mockWorkspaceUri]: '123',
				},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const activeProfile = await getActiveProfile();
			expect(activeProfile).toEqual({ location: '123', name: 'Work' });
		});

		it('should return the default profile if no workspace is associated', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const activeProfile = await getActiveProfile();
			expect(activeProfile).toEqual({ location: '__default__profile__', name: 'Default' });
		});

		it('should return the default profile if there are no workspace folders', async () => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue(undefined);

			const activeProfile = await getActiveProfile();
			expect(activeProfile).toEqual({ location: '__default__profile__', name: 'Default' });
		});
	});

	describe('getAllGlobalSnippetDirs', () => {
		it('should return all global snippet directories', async () => {
			const mockProfiles: ProfileInfo[] = [
				{ location: '123', name: 'Test Profile' },
				{ location: '456', name: 'Another Profile' },
			];
			(context.globalState.get as Mock).mockReturnValue(mockProfiles);

			const dirs = await getAllGlobalSnippetDirs();
			expect(dirs).toHaveLength(3); // 2 profiles + default
			expect(dirs).toContain(path.join(mockUserPath, 'profiles', '123', 'snippets'));
			expect(dirs).toContain(path.join(mockUserPath, 'profiles', '456', 'snippets'));
			expect(dirs).toContain(path.join(mockUserPath, 'snippets'));
		});
	});

	describe('getActiveProfilePath', () => {
		const mockProfiles: ProfileInfo[] = [{ location: '123', name: 'Work' }];
		const mockWorkspaceUri = 'file:///path/to/workspace';

		beforeEach(() => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
				{ uri: { toString: () => mockWorkspaceUri } as Uri, name: 'Work', index: 0 },
			]);
		});

		it('should return the user path for the default profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const profilePath = await getActiveProfilePath();
			expect(profilePath).toBe(mockUserPath);
		});

		it('should return the correct path for a custom profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {
					[mockWorkspaceUri]: '123',
				},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const profilePath = await getActiveProfilePath();
			expect(profilePath).toBe(path.join(mockUserPath, 'profiles', '123'));
		});
	});

	describe('getActiveProfileSnippetsDir', () => {
		const mockProfiles: ProfileInfo[] = [{ location: '123', name: 'Work' }];
		const mockWorkspaceUri = 'file:///path/to/workspace';

		beforeEach(() => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
				{ uri: { toString: () => mockWorkspaceUri } as Uri, name: 'Work', index: 0 },
			]);
		});

		it('should return the snippets directory for the default profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const snippetsDir = await getActiveProfileSnippetsDir();
			expect(snippetsDir).toBe(path.join(mockUserPath, 'snippets'));
		});

		it('should return the snippets directory for a custom profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {
					[mockWorkspaceUri]: '123',
				},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const snippetsDir = await getActiveProfileSnippetsDir();
			expect(snippetsDir).toBe(path.join(mockUserPath, 'profiles', '123', 'snippets'));
		});
	});

	describe('getGlobalLangFile', () => {
		const mockProfiles: ProfileInfo[] = [{ location: '123', name: 'Work' }];
		const mockWorkspaceUri = 'file:///path/to/workspace';

		beforeEach(() => {
			vi.spyOn(vscode.workspace, 'workspaceFolders', 'get').mockReturnValue([
				{ uri: { toString: () => mockWorkspaceUri } as Uri, name: 'Work', index: 0 },
			]);
		});

		it('should return the global language file path for the default profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const langFile = await getGlobalLangFile('typescript');
			expect(langFile).toBe(path.join(mockUserPath, 'snippets', 'typescript.json'));
		});

		it('should return the global language file path for a custom profile', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {
					[mockWorkspaceUri]: '123',
				},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const langFile = await getGlobalLangFile('javascript');
			expect(langFile).toBe(
				path.join(mockUserPath, 'profiles', '123', 'snippets', 'javascript.json')
			);
		});

		it('should handle different language identifiers', async () => {
			const mockAssociations: ProfileAssociations = {
				workspaces: {},
				emptyWindows: {},
			};
			(context.globalState.get as Mock).mockImplementation((key: string) => {
				if (key === 'users') {
					return mockProfiles;
				}
				if (key === 'profileAssociations') {
					return mockAssociations;
				}
			});

			const pythonFile = await getGlobalLangFile('python');
			const rustFile = await getGlobalLangFile('rust');

			expect(pythonFile).toBe(path.join(mockUserPath, 'snippets', 'python.json'));
			expect(rustFile).toBe(path.join(mockUserPath, 'snippets', 'rust.json'));
		});
	});
});
