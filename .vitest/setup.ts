import { vi } from 'vitest';
import { loadEnvFile } from 'node:process';
import path from 'node:path';

vi.mock('../src/vscode', async () => {
	return await import('./__mocks__/vscode');
});

try {
	loadEnvFile(path.resolve(__dirname, '.env'));
} catch {}
