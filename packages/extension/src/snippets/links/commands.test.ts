import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import { showQuickPick, showWarningMessage, ThemeIcon, showInformationMessage } from '../../vscode';
import { removeFileLink, addFileLink, getLinkLocations } from './config';
import {
	getProfiles,
	getPathFromProfileLocation,
	getAllGlobalSnippetDirs,
} from '../../utils/profile';
import { readSnippetFile, writeSnippetFile } from '../../utils/jsoncFilesIO';
import { exists } from '../../utils/fsInfo';
import { manageLinkLocations } from './commands';
import type { ProfileInfo, VSCodeSnippets } from '../../types';
import type { QuickPickItem } from 'vscode';

vi.mock('./config');
vi.mock('../../utils/profile');
vi.mock('../../utils/jsoncFilesIO');
vi.mock('../../utils/fsInfo');

const filepath = '/Users/test/vscode/snippets/test.code-snippets';
const filename = 'test.code-snippets';

const mockProfiles: ProfileInfo[] = [
	{ location: '__default__profile__', name: 'Default', icon: 'account' },
	{ location: 'profile1', name: 'Profile 1', icon: 'briefcase' },
];

const mockQuickPickItems: QuickPickItem[] = [
	{
		iconPath: new ThemeIcon('account'),
		label: 'Default',
		detail: '/Users/test/vscode/snippets',
		description: '__default__profile__',
		picked: true,
	},
	{
		iconPath: new ThemeIcon('briefcase'),
		label: 'Profile 1',
		detail: '/Users/test/vscode/profiles/profile1/snippets',
		description: 'profile1',
		picked: false,
	},
];

describe('src/snippets/links/commands.ts', () => {
	beforeEach(() => {
		(getProfiles as Mock).mockResolvedValue(mockProfiles);
		(getPathFromProfileLocation as Mock).mockImplementation((loc) =>
			loc === '__default__profile__'
				? '/Users/test/vscode/snippets'
				: `/Users/test/vscode/profiles/${loc}/snippets`
		);
		(readSnippetFile as Mock).mockResolvedValue({} as VSCodeSnippets);
		(writeSnippetFile as Mock).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('manageLinkLocations', () => {
		it('should do nothing if quick pick is cancelled', async () => {
			(getLinkLocations as Mock).mockResolvedValue(['/Users/test/vscode/snippets']);
			(showQuickPick as Mock).mockResolvedValue(undefined);

			await manageLinkLocations(true, filepath);

			expect(addFileLink).not.toHaveBeenCalled();
			expect(removeFileLink).not.toHaveBeenCalled();
		});

		it('should link to multiple profiles when selected', async () => {
			const selectedItems = mockQuickPickItems;
			(getLinkLocations as Mock).mockResolvedValue(['/Users/test/vscode/snippets']);
			(showQuickPick as Mock).mockResolvedValue(selectedItems);

			await manageLinkLocations(true, filepath);

			expect(addFileLink).toHaveBeenCalledWith(filename, ['__default__profile__', 'profile1']);
			expect(writeSnippetFile).toHaveBeenCalledTimes(2);
			expect(fs.rm).not.toHaveBeenCalled();
			expect(showInformationMessage).toHaveBeenCalledWith(`${filename} is now used by 2 profiles`);
		});

		it('should remove links when only one profile is selected', async () => {
			const selectedItems = [mockQuickPickItems[0]];
			(getLinkLocations as Mock).mockResolvedValue(['/Users/test/vscode/snippets']);
			(showQuickPick as Mock).mockResolvedValue(selectedItems);

			await manageLinkLocations(true, filepath);

			expect(removeFileLink).toHaveBeenCalledWith(filename);
			expect(writeSnippetFile).toHaveBeenCalledTimes(1);
			expect(fs.rm).toHaveBeenCalledWith(
				path.join('/Users/test/vscode/profiles/profile1/snippets', filename)
			);
			expect(showInformationMessage).toHaveBeenCalledWith(`${filename} is now used by 1 profiles`);
		});

		it('should remove all links and files when no profile is selected', async () => {
			(getLinkLocations as Mock).mockResolvedValue(['/Users/test/vscode/snippets']);
			(showQuickPick as Mock).mockResolvedValue([]);

			await manageLinkLocations(true, filepath);

			expect(removeFileLink).toHaveBeenCalledWith(filename);
			expect(writeSnippetFile).not.toHaveBeenCalled();
			expect(fs.rm).toHaveBeenCalledTimes(2);
			expect(showInformationMessage).toHaveBeenCalledWith(`${filename} is now used by 0 profiles`);
		});

		describe('canBeLinked', () => {
			it('should show info and return false if only one profile', async () => {
				(getAllGlobalSnippetDirs as Mock).mockResolvedValue(['dir1']);
				await manageLinkLocations(false, filepath);
				expect(showInformationMessage).toHaveBeenCalledWith('You have no other vscode profiles.');
				expect(showQuickPick).not.toHaveBeenCalled();
			});

			it('should show warning and return false if file exists in multiple profiles', async () => {
				(getAllGlobalSnippetDirs as Mock).mockResolvedValue(['dir1', 'dir2']);
				(exists as Mock).mockResolvedValue(true); // exists in both
				await manageLinkLocations(false, filepath);
				expect(showWarningMessage).toHaveBeenCalledWith(
					"It's not safe to watch for changes across all profiles when another file of it's same name exists in another profile."
				);
				expect(showQuickPick).not.toHaveBeenCalled();
			});

			it('should proceed if file can be linked', async () => {
				(getAllGlobalSnippetDirs as Mock).mockResolvedValue(['dir1', 'dir2']);
				(exists as Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false); // only exists in one
				(showQuickPick as Mock).mockResolvedValue([]); // cancel to stop execution

				await manageLinkLocations(false, filepath);

				expect(showWarningMessage).not.toHaveBeenCalled();
				expect(showQuickPick).toHaveBeenCalled();
			});
		});
	});
});
