import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: '.vitest/setup.ts',
		environment: 'node',
		silent: 'passed-only',
		slowTestThreshold: 800,
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: ['src/extension.ts', 'src/commands/index.ts', 'src/vscode.ts', '**/*.d.ts'],
			watermarks: {
				statements: [30, 60],
				functions: [40, 70],
				branches: [50, 80],
				lines: [30, 60],
			},
		},
	},
});
