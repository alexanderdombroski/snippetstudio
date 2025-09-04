import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import path from 'node:path';
import { getUserPath } from '../../utils/context';
import { readJsonC, writeJson } from '../../utils/jsoncFilesIO';
import {
	getActiveProfile,
	getPathFromProfileLocation,
	getProfileIdFromPath,
	getProfiles,
} from '../../utils/profile';
import { exists, isParentDir } from '../../utils/fsInfo';
import { createFile } from '../newSnippetFile';
import {
	addFileLink,
	removeFileLink,
	getLinkedSnippets,
	getLinkLocations,
	isSnippetLinked,
} from './config';
import type { ProfileInfo, SnippetLinks } from '../../types';

vi.mock('../../utils/context');
vi.mock('../../utils/jsoncFilesIO');
vi.mock('../../utils/profile');
vi.mock('../../utils/fsInfo');
vi.mock('../newSnippetFile.js');

const userPath = '/Users/test/vscode';
const defaultSettingsPath = path.join(userPath, 'settings.json');
const profile1SettingsPath = path.join(userPath, 'profiles', 'profile1', 'settings.json');

const mockProfiles: ProfileInfo[] = [
	{ location: '__default__profile__', name: 'Default' },
	{ location: 'profile1', name: 'Profile 1' },
];

describe('src/snippets/links/config.ts', () => {
	beforeEach(() => {
		(getUserPath as Mock).mockReturnValue(userPath);
		(getProfiles as Mock).mockResolvedValue(mockProfiles);
		(createFile as Mock).mockResolvedValue(undefined);
		(writeJson as Mock).mockResolvedValue(undefined);
		(exists as Mock).mockResolvedValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getLinkedSnippets', () => {
		it('should return empty object if no links are present', async () => {
			(readJsonC as Mock).mockResolvedValue({});
			const links = await getLinkedSnippets();
			expect(links).toEqual({});
		});

		it("should return empty object if settings file doesn't exist", async () => {
			(exists as Mock).mockResolvedValue(false);
			const links = await getLinkedSnippets();
			expect(links).toEqual({});
		});

		it('should return links if they exist', async () => {
			const mockLinks: SnippetLinks = { 'test.code-snippets': ['__default__profile__'] };
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			const links = await getLinkedSnippets();
			expect(links).toEqual(mockLinks);
		});

		it('should handle backward compatibility for string array', async () => {
			const oldLinks = ['test.code-snippets'];
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': oldLinks });
			const links = await getLinkedSnippets();
			expect(links).toEqual({
				'test.code-snippets': ['__default__profile__', 'profile1'],
			});
		});
	});

	describe('addFileLink', () => {
		it('should add a new file link', async () => {
			(readJsonC as Mock).mockResolvedValue({}); // for getLinkedSnippets
			(readJsonC as Mock).mockResolvedValueOnce({}); // for updateAllSettings
			(readJsonC as Mock).mockResolvedValueOnce({}); // for updateAllSettings

			await addFileLink('test.code-snippets', ['__default__profile__']);

			expect(writeJson).toHaveBeenCalledTimes(2);
			expect(writeJson).toHaveBeenCalledWith(defaultSettingsPath, {
				'snippetstudio.file.linkedFiles': { 'test.code-snippets': ['__default__profile__'] },
			});
			expect(writeJson).toHaveBeenCalledWith(profile1SettingsPath, {
				'snippetstudio.file.linkedFiles': { 'test.code-snippets': ['__default__profile__'] },
			});
		});
	});

	describe('removeFileLink', () => {
		it('should remove a file link', async () => {
			const mockLinks: SnippetLinks = {
				'test.code-snippets': ['__default__profile__'],
				'another.code-snippets': ['profile1'],
			};
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			(readJsonC as Mock).mockResolvedValueOnce({ 'snippetstudio.file.linkedFiles': mockLinks });
			(readJsonC as Mock).mockResolvedValueOnce({ 'snippetstudio.file.linkedFiles': mockLinks });

			await removeFileLink('test.code-snippets');

			const expectedLinks = { 'another.code-snippets': ['profile1'] };
			expect(writeJson).toHaveBeenCalledTimes(2);
			expect(writeJson).toHaveBeenCalledWith(defaultSettingsPath, {
				'snippetstudio.file.linkedFiles': expectedLinks,
			});
			expect(writeJson).toHaveBeenCalledWith(profile1SettingsPath, {
				'snippetstudio.file.linkedFiles': expectedLinks,
			});
		});
	});

	describe('getLinkLocations', () => {
		const filepath = path.join(userPath, 'snippets', 'test.code-snippets');

		it('should return empty array if not a user snippet', async () => {
			(isParentDir as Mock).mockReturnValue(false);
			const locations = await getLinkLocations(filepath);
			expect(locations).toEqual([]);
		});

		it('should return empty array if snippet is not linked', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			(readJsonC as Mock).mockResolvedValue({});
			const locations = await getLinkLocations(filepath);
			expect(locations).toEqual([]);
		});

		it('should return empty array if snippet link does not include current profile', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			const mockLinks: SnippetLinks = { 'test.code-snippets': ['profile1'] };
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			(getProfileIdFromPath as Mock).mockReturnValue('__default__profile__');
			const locations = await getLinkLocations(filepath);
			expect(locations).toEqual([]);
		});

		it('should return link locations if snippet is linked', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			const mockLinks: SnippetLinks = {
				'test.code-snippets': ['__default__profile__', 'profile1'],
			};
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			(getProfileIdFromPath as Mock).mockReturnValue('__default__profile__');
			(getPathFromProfileLocation as Mock).mockImplementation((loc) =>
				loc === '__default__profile__' ? userPath : path.join(userPath, 'profiles', loc)
			);

			const locations = await getLinkLocations(filepath);
			expect(locations).toEqual([userPath, path.join(userPath, 'profiles', 'profile1')]);
		});
	});

	describe('isSnippetLinked', () => {
		const filepath = path.join(userPath, 'snippets', 'test.code-snippets');

		it('should return false if not a user snippet', async () => {
			(isParentDir as Mock).mockReturnValue(false);
			const isLinked = await isSnippetLinked(filepath);
			expect(isLinked).toBe(false);
		});

		it('should return false if file is not in linked snippets', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			(readJsonC as Mock).mockResolvedValue({});
			const isLinked = await isSnippetLinked(filepath);
			expect(isLinked).toBe(false);
		});

		it('should return true if linked in current profile (non-strict)', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			const mockLinks: SnippetLinks = { 'test.code-snippets': ['__default__profile__'] };
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			(getActiveProfile as Mock).mockResolvedValue({
				location: '__default__profile__',
				name: 'Default',
				snippets: [],
			});
			const isLinked = await isSnippetLinked(filepath);
			expect(isLinked).toBe(true);
		});

		it('should return false if not linked in current profile (non-strict)', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			const mockLinks: SnippetLinks = { 'test.code-snippets': ['profile1'] };
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			(getActiveProfile as Mock).mockResolvedValue({
				location: '__default__profile__',
				name: 'Default',
				snippets: [],
			});
			const isLinked = await isSnippetLinked(filepath);
			expect(isLinked).toBe(false);
		});

		it('should return true if linked to any profile (strict)', async () => {
			(isParentDir as Mock).mockReturnValue(true);
			const mockLinks: SnippetLinks = { 'test.code-snippets': ['profile1'] };
			(readJsonC as Mock).mockResolvedValue({ 'snippetstudio.file.linkedFiles': mockLinks });
			const isLinked = await isSnippetLinked(filepath, true);
			expect(isLinked).toBe(true);
		});
	});
});
