import { vi } from 'vitest';

vi.mock('../src/vscode', async () => {
	return await import('./__mocks__/vscode');
});
