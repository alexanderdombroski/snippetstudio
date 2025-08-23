import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: '.vitest/setup.ts',
		environment: 'node',
		silent: 'passed-only',
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/extension.ts', 'src/commands/index.ts', 'src/vscode.ts', '**/*.d.ts'],
			watermarks: {
				statements: [40, 75],
				functions: [50, 80],
				branches: [50, 80],
				lines: [40, 75],
			},
		},
	},
});
