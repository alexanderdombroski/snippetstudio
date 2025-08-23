import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: '.vitest/setup.ts',
		environment: 'node',
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/extension.ts', 'src/vscode.ts', '**/*.d.ts'],
		},
	},
});
