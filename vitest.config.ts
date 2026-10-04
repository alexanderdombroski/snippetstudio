import { defineConfig } from 'vitest/config';
import path from 'node:path';

const setup = path.join(import.meta.dirname, '.vitest', 'setup.ts');

export default defineConfig({
	test: {
		setupFiles: [setup],
		isolate: false,
		silent: 'passed-only',
		coverage: {
			provider: 'v8',
			watermarks: {
				statements: [30, 60],
				functions: [40, 70],
				branches: [50, 80],
				lines: [30, 60],
			},
		},
	},
});
