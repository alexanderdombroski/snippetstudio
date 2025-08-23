import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: '.vitest/setup.ts',
		environment: 'node',
		silent: 'passed-only',
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/extension.ts', 'src/vscode.ts', '**/*.d.ts'],
		},
	},
});
