import { describe, it, expect, vi, beforeAll } from 'vitest';
import { extractHandler, fetchHandler, modifyHandler } from './handlers';
import { refreshAll } from '../utils';
import { importBuiltinExtension } from '../../git/extensionsGithub';
import { extractAllSnippets, extractAndModify } from '../../snippets/extension/transfer';
import { executeCommand } from '../../vscode';

vi.mock('../../snippets/extension/transfer');
vi.mock('../../git/extensionsGithub');
vi.mock('../utils');

beforeAll(() => {
	vi.clearAllMocks();
});

describe('handlers', () => {
	describe('extractHandler', () => {
		it('should run the command', async () => {
			await extractHandler({ label: 'hi', collapsibleState: 1, path: 'python.json' });
			expect(extractAllSnippets).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
	describe('fetchHandler', () => {
		it('should run the command', async () => {
			await fetchHandler();
			expect(importBuiltinExtension).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});
	describe('modifyHandler', () => {
		it('should run the command', async () => {
			await modifyHandler({ label: 'test', path: 'path/example', collapsibleState: 0 });
			expect(extractAndModify).toBeCalled();
			expect(executeCommand).toBeCalled();
		});
	});
});
