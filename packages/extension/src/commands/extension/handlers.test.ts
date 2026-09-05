import { describe, it, expect, vi, beforeAll } from 'vitest';
import { extractHandler, modifyHandler } from './handlers';
import { refreshAll } from '../utils';
import { extractAllSnippets, extractAndModify } from '../../snippets/extension/transfer';

vi.mock('../../snippets/extension/transfer');
vi.mock('../../git/extensionsGithub');
vi.mock('../utils');

beforeAll(() => {
	vi.clearAllMocks();
});

describe('handlers', () => {
	describe('extractHandler', () => {
		it('should run the command', async () => {
			await extractHandler({
				label: 'hi',
				collapsibleState: 1,
				filepath: 'python.json',
				contextValue: 'ext-snippet-file',
			});
			expect(extractAllSnippets).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
	describe('modifyHandler', () => {
		it('should run the command', async () => {
			await modifyHandler({
				label: 'test',
				path: 'path/example',
				collapsibleState: 0,
				description: 'snippetTitle',
				contextValue: 'ext-snippet',
			});
			expect(extractAndModify).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
});
