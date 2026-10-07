import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { resetGlobalSnippets } from './reset';
import { getConfirmation } from '../../utils/user';
import { getDeviceSettings } from '../../utils/local';
import { getUserPath } from '../../utils/context';
import { exists } from '../../utils/fsInfo';
import { getLinkLocations, isSnippetLinked } from '../links/config';
import { showErrorMessage, showInformationMessage, showWarningMessage } from '../../vscode';

vi.mock('node:fs/promises');
vi.mock('../../utils/user');
vi.mock('../../utils/local');
vi.mock('../../utils/context');
vi.mock('../../utils/fsInfo');
vi.mock('../links/config');

describe('resetGlobalSnippets', () => {
	const currentIdeUserPath = '/Users/test/vscode';
	const startingIdeUserPath = '/Users/test/cursor';

	beforeEach(() => {
		vi.clearAllMocks();
		(getUserPath as Mock).mockImplementation((ide?: string) => {
			if (ide === 'Cursor') return startingIdeUserPath;
			return currentIdeUserPath;
		});
		(exists as Mock).mockResolvedValue(true);
		(fs.readdir as Mock).mockResolvedValue([]);
		(fs.rm as Mock).mockResolvedValue(undefined);
		(fs.mkdir as Mock).mockResolvedValue(undefined);
		(fs.cp as Mock).mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should return false if user cancels confirmation', async () => {
		(getConfirmation as Mock).mockResolvedValue(false);

		const result = await resetGlobalSnippets();

		expect(result).toBe(false);
		expect(fs.cp).not.toHaveBeenCalled();
	});

	it('should bypass confirmation when skipConfirmation is true', async () => {
		(getDeviceSettings as Mock).mockResolvedValue({
			'sync.startingEditor': 'Cursor',
		});
		(exists as Mock).mockResolvedValue(true);

		await resetGlobalSnippets(true);

		expect(getConfirmation).not.toHaveBeenCalled();
	});

	it('should show error and return false if no starting editor configured', async () => {
		(getConfirmation as Mock).mockResolvedValue(true);
		(getDeviceSettings as Mock).mockResolvedValue({});

		const result = await resetGlobalSnippets();

		expect(result).toBe(false);
		expect(showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining('No default IDE (starting editor) configured')
		);
		expect(fs.cp).not.toHaveBeenCalled();
	});

	it('should show warning and return false if starting editor is current editor', async () => {
		(getConfirmation as Mock).mockResolvedValue(true);
		(getDeviceSettings as Mock).mockResolvedValue({
			'sync.startingEditor': 'Visual Studio Code',
		});

		const result = await resetGlobalSnippets();

		expect(result).toBe(false);
		expect(showWarningMessage).toHaveBeenCalledWith(
			expect.stringContaining('Current editor is already the default IDE')
		);
		expect(fs.cp).not.toHaveBeenCalled();
	});

	it('should show error and return false if source snippets directory does not exist', async () => {
		(getConfirmation as Mock).mockResolvedValue(true);
		(getDeviceSettings as Mock).mockResolvedValue({
			'sync.startingEditor': 'Cursor',
		});
		(exists as Mock).mockResolvedValue(false);

		const result = await resetGlobalSnippets();

		expect(result).toBe(false);
		expect(showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining('Source snippets directory not found')
		);
		expect(fs.cp).not.toHaveBeenCalled();
	});

	it('should reset snippet folder from default IDE and update linked files', async () => {
		(getConfirmation as Mock).mockResolvedValue(true);
		(getDeviceSettings as Mock).mockResolvedValue({
			'sync.startingEditor': 'Cursor',
			'sync.editors': ['Visual Studio Code'],
		});
		(exists as Mock).mockResolvedValue(true);
		(fs.readdir as Mock).mockResolvedValue(['test.code-snippets']);
		(fs.stat as Mock).mockResolvedValue({ isFile: () => true });
		(fs.readFile as Mock).mockResolvedValue('{"snippet": {}}');
		(isSnippetLinked as Mock).mockResolvedValue(true);
		(getLinkLocations as Mock).mockResolvedValue(['/Users/test/vscode/profiles/work/snippets']);

		const result = await resetGlobalSnippets();

		expect(result).toBe(true);
		expect(fs.rm).toHaveBeenCalledWith(path.join(currentIdeUserPath, 'snippets'), {
			recursive: true,
			force: true,
		});
		expect(fs.cp).toHaveBeenCalledWith(
			path.join(startingIdeUserPath, 'snippets'),
			path.join(currentIdeUserPath, 'snippets'),
			{ recursive: true }
		);
		expect(fs.writeFile).toHaveBeenCalledWith(
			path.join('/Users/test/vscode/profiles/work/snippets', 'test.code-snippets'),
			'{"snippet": {}}',
			'utf-8'
		);
		expect(showInformationMessage).toHaveBeenCalledWith('Successfully reset global snippets.');
	});
});
