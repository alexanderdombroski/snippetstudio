import { defineConfig, mergeConfig, type Plugin, type UserConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import baseConfig from '../../vite.config.ts';

function vscodeCjsWrapper(): Plugin {
	return {
		name: 'vscode-cjs-wrapper',
		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'extension.js',
				source: [
					'let mod;',
					'',
					'const modReady = (async () => {',
					'	mod = await import("./extension.mjs");',
					'})();',
					'',
					'module.exports = {',
					'	async activate(...args) {',
					'		await modReady;',
					'		return mod.activate(...args);',
					'	},',
					'	async deactivate(...args) {',
					'		await modReady;',
					'		return mod.deactivate(...args);',
					'	}',
					'};',
				].join('\n'),
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	const isProd = mode === 'production';

	return mergeConfig(baseConfig, {
		root: 'src',
		plugins: [vscodeCjsWrapper(), ViteMinifyPlugin()],

		build: {
			outDir: '../dist',
			emptyOutDir: isProd,
			minify: isProd,
			sourcemap: !isProd,

			modulePreload: false,

			rolldownOptions: {
				input: {
					extension: 'extension.ts',
					snippetData: 'snippetData.html',
				},
				preserveEntrySignatures: 'exports-only',
				external: ['vscode'],
				output: {
					format: 'esm',
					keepNames: !isProd,
					entryFileNames: 'extension.mjs',
					chunkFileNames: 'chunks/[name]-[hash].mjs',
				},
			},
		},
		define: {
			'process.env.IS_PRODUCTION_BUILD': JSON.stringify(isProd),
		},
	} satisfies UserConfig);
});
