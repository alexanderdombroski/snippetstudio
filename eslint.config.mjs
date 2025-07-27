import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

const customPlugin = {
  rules: {
    'no-extension-on-imports-except-await': {
      meta: {
        type: 'problem',
        docs: {
          description: "Disallow .js/.ts extensions on imports except awaited dynamic imports",
        },
        schema: [],
      },
      create(context) {
        function checkImportSource(node, value) {
          if (/\.(js|ts)$/.test(value)) {
            context.report({
              node,
              message: "Import paths should not include extensions '.js' or '.ts'",
            });
          }
        }

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
  }
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
			

			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
			semi: 'warn',
		},

		// settings: {
		// 	'import/extensions': ['.js', '.ts'],
		// 	'import/resolver': {
		// 		node: {
		// 			extensions: [],
		// 		},
		// 	},
		// },
	},
];
