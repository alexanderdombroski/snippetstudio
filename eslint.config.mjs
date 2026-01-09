import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';

const customPlugin = {
	rules: {
		'no-extension-on-imports-except-await': {
			meta: {
				type: 'problem',
				docs: {
					description: 'Disallow .js/.ts extensions on imports except awaited dynamic imports',
				},
				schema: [],
			},
			create(context) {
				const checkImportSource = (node, value) => {
					if (/\.(js|ts)$/.test(value)) {
						context.report({
							node,
							message: "Import paths should not include extensions '.js' or '.ts'",
						});
					}
				};

				return {
					ImportDeclaration(node) {
						if (node.source && node.source.value) {
							checkImportSource(node.source, node.source.value);
						}
					},
					ImportExpression(node) {
						if (node.parent && node.parent.type === 'AwaitExpression') {
							return;
						}
						if (node.source && typeof node.source.value === 'string') {
							checkImportSource(node.source, node.source.value);
						}
					},
					ExportNamedDeclaration(node) {
						// node.source exists if this is a re-export
						if (node.source && node.source.value) {
							checkImportSource(node.source, node.source.value);
						}
					},
				};
			},
		},
	},
};

export default [
	importPlugin.flatConfigs.typescript,
	{
		ignores: ['node_modules/**', 'dist/**'],
	},
	{
		files: ['**/*.ts'],
	},
	{
		plugins: {
			'@typescript-eslint': typescriptEslint,
			custom: customPlugin,
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2022,
			sourceType: 'module',
		},

		rules: {
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],

			'import/extensions': [
				'error',
				'never',
				{
					ts: 'never',
					js: 'never',
				},
			],
			'custom/no-extension-on-imports-except-await': 'error',
			'no-restricted-imports': ['error', { patterns: ['**/*.test*'] }],

			'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
			semi: 'warn',
			'object-shorthand': 'warn',
			'no-var': 'warn',
		},
	},
	jsdoc.configs['flat/recommended-typescript'],
	{
		files: ['**/*.ts'],
		plugins: {
			jsdoc,
		},
		rules: {
			'@typescript-eslint/consistent-type-imports': 'warn',
			'jsdoc/require-jsdoc': [
				'warn',
				{
					require: {
						ClassDeclaration: true,
						FunctionDeclaration: true,
						MethodDefinition: true,
					},
					checkConstructors: false,
				},
			],
			'jsdoc/require-returns': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/lines-before-block': 'warn',
			'jsdoc/check-indentation': 'warn',
			'jsdoc/require-description': 'error',
			'jsdoc/multiline-blocks': [
				'warn',
				{
					noSingleLineBlocks: false,
					noMultilineBlocks: true,
				},
			],
		},
	},
	{
		files: ['**/*.ts'],
		plugins: {
			jsdoc,
		},
		files: ['**/*.test.ts'],
		rules: {
			'jsdoc/require-jsdoc': 'off',
		},
	},
	{
		files: ['**/*.js', '**/*.mjs'],
		plugins: {
			jsdoc,
		},
		rules: {
			'jsdoc/no-types': 'off',
		},
	},
];
