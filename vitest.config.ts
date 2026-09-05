import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
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
