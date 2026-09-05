import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';
import path from 'node:path';

const setup = path.join(import.meta.dirname, '.vitest', 'setup.ts');

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			isolate: true,
			setupFiles: [setup],
			environment: 'node',
			slowTestThreshold: 800,
			coverage: {
				include: ['src/**/*.ts'],
				exclude: [
					'src/extension.ts', // Entrypoint
					'src/commands/index.ts', // Barrel file
					'src/ui/templates/index.ts', // Barrel file
					'src/vscode.ts', // Barrel file
					'**/*.d.ts', // types
				],
			},
		},
	})
);
