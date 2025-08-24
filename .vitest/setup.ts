import { vi } from 'vitest';
import { loadEnvFile } from 'node:process';
import path from 'node:path';

try {
	loadEnvFile(path.resolve(__dirname, '.env'));
} catch {}

vi.mock('../src/vscode', async () => {
	return await import('./__mocks__/vscode');
});

vi.mock('node:fs');
vi.mock('node:fs/promises');
