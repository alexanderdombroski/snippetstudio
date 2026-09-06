import { defineConfig } from 'oxlint';

export default defineConfig({
	ignorePatterns: ['**/node_modules/**', '**/dist/**', 'packages/docs/**'],
	options: {
		typeAware: true,
		typeCheck: true,
		maxWarnings: 0,
		reportUnusedDisableDirectives: 'warn',
	},
	plugins: ['eslint', 'typescript', 'import', 'unicorn', 'oxc'],
	rules: {
		// Imports
		'import/extensions': ['warn', 'never'],
		'no-restricted-imports': ['error', { patterns: ['**/*.test.ts'] }],
		'typescript/consistent-type-imports': 'warn',

		// Variables
		'prefer-const': 'warn',
		'no-var': 'error',
		'object-shorthand': 'warn',

		// Expressions
		eqeqeq: 'warn',
		'typescript/no-base-to-string': 'allow',

		// Errors
		'no-throw-literal': 'warn',
	},
	overrides: [
		{
			files: ['**/*.test.ts'],
			rules: {
				'typescript/unbound-method': 'off',
				'typescript/no-misused-spread': 'off',
			},
		},
		{
			files: ['vitest.config.{ts,mts}', 'vite.config.{ts,mts}'],
			rules: {
				'import/extensions': ['warn', 'ignorePackages'],
			},
		},
	],
});
