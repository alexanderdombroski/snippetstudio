import { describe, it, expect, vi, beforeAll } from 'vitest';
import { importHandler, linkHandler } from './handlers';
import { refreshAll } from '../utils';
import { manageLinkLocations } from '../../snippets/links/commands';
import { importCodeProfileSnippets } from '../../snippets/codeProfile';

vi.mock('../../snippets/codeProfile');
vi.mock('../../snippets/links/commands');
vi.mock('../utils');

beforeAll(() => {
	vi.clearAllMocks();
});

describe('handlers', () => {
	describe('linkHandler', () => {
		it('should run the command', async () => {
			await linkHandler({
				label: 'hi',
				collapsibleState: 1,
				filepath: 'python.json',
				contextValue: 'file',
			});
			expect(manageLinkLocations).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
	describe('importHandler', () => {
		it('should run the command', async () => {
			await importHandler();
			expect(importCodeProfileSnippets).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
});
