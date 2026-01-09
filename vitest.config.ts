import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		setupFiles: '.vitest/setup.ts',
		environment: 'node',
		silent: 'passed-only',
		slowTestThreshold: 800,
		clearMocks: true,
		coverage: {
			provider: 'v8',
			include: ['src/**'],
			exclude: [
				'src/extension.ts', // Entrypoint
				'src/commands/index.ts', // Barrel file
				'src/ui/templates/index.ts', // Barrel file
				'src/vscode.ts', // Barrel file
				'**/*.d.ts', // types
			],
			watermarks: {
				statements: [30, 60],
				functions: [40, 70],
				branches: [50, 80],
				lines: [30, 60],
			},
		},
	},
});
