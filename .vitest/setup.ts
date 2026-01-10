import { vi } from 'vitest';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { context } from './__mocks__/shared';

try {
	loadEnvFile(path.resolve(__dirname, '.env'));
} catch {}

vi.mock('../src/vscode', async () => {
	return await import('./__mocks__/vscode');
});

vi.mock('../src/utils/context', async () => {
	const actual = await vi.importActual('../src/utils/context');
	return {
		...actual,
		getExtensionContext: vi.fn(() => context),
	};
});

vi.mock('node:fs');
vi.mock('node:fs/promises');
