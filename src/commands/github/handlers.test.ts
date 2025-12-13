import { describe, it, expect, vi, beforeAll } from 'vitest';
import { exportHandler, importHandler, browseHandler } from './handlers';
import { refreshAll } from '../utils';
import { createGist, importGist } from '../../git/snippetGists';
import { openExternal } from '../../vscode';

vi.mock('../../git/snippetGists');
vi.mock('../utils');

beforeAll(() => {
	vi.clearAllMocks();
});

describe('handlers', () => {
	describe('exportHandler', () => {
		it('should run the command', async () => {
			await exportHandler();
			expect(createGist).toBeCalled();
		});
	});

	describe('importHandler', () => {
		it('should run the command', async () => {
			await importHandler();
			expect(importGist).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('browseHandler', () => {
		it('should run the command', async () => {
			await browseHandler();
			expect(openExternal).toBeCalled();
		});
	});
});
