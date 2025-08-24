import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import loadSnippets from './loadSnippets';
import { getConfiguration } from '../vscode';
import { readJsoncFilesAsync } from '../utils/jsoncFilesIO';
import { locateSnippetFiles } from './locateSnippets';
import * as templates from '../ui/templates';
import { getCurrentLanguage } from '../utils/language';
import { getLinkedSnippets } from './links/config';
import { getProfileIdFromPath } from '../utils/profile';

vi.mock('../utils/jsoncFilesIO');
vi.mock('./locateSnippets');
vi.mock('../utils/language');
vi.mock('./links/config');
vi.mock('../utils/profile');

(getConfiguration as Mock).mockReturnValue({ get: () => false });
(getCurrentLanguage as Mock).mockReturnValue('typescript');
(locateSnippetFiles as Mock).mockResolvedValue(['/path/to/snippets.json']);
(readJsoncFilesAsync as Mock).mockResolvedValue([['/path/to/snippets.json', {}]]);

describe('loadSnippets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should set context for linked snippets', async () => {
		(getLinkedSnippets as Mock).mockResolvedValue({ 'snippets.json': ['profile'] });
		(getProfileIdFromPath as Mock).mockReturnValue('profile');

		vi.spyOn(templates, 'createTreeItemFromFilePath');
		await loadSnippets();

		expect(templates.createTreeItemFromFilePath).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(Number),
			'snippet-filepath linked'
		);
	});

	it('should filter empty groups if setting is false', async () => {
		(getLinkedSnippets as Mock).mockResolvedValue({});
		(getConfiguration as Mock).mockReturnValue({ get: () => false });

		const result = await loadSnippets();

		expect(result).toHaveLength(0);
	});

	it('should not filter empty groups if setting is true', async () => {
		(getLinkedSnippets as Mock).mockResolvedValue({});
		(getConfiguration as Mock).mockReturnValue({ get: () => true });

		const result = await loadSnippets();

		expect(result).toHaveLength(1);
	});
});
