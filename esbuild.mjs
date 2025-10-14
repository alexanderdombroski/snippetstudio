import { context } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const outdir = 'dist';

const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

/** Add an auto-generated CommonJS wrapper for VS Code entry point */
async function writeCjsWrapper() {
	const code = [
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
	].join('\n');

	await fs.writeFile(path.join(outdir, 'extension.js'), code);
}

/** Function to minify and bundle code */
async function main() {
	const ctx = await context({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		format: 'esm',
		minify: production,
		treeShaking: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'node',
		outdir,
		splitting: true,
		external: ['vscode', ...(await import('node:module')).builtinModules],
		logLevel: 'silent',
		plugins: [esbuildProblemMatcherPlugin],
		minifySyntax: true,
		outExtension: {
			'.js': '.mjs',
		},
		define: {
			'process.env.USE_VERBOSE_LOGGING': JSON.stringify(!production),
		},
		drop: production ? ['console', 'debugger'] : [],
		chunkNames: 'chunks/[name]-[hash]',
		metafile: production,
	});

	if (watch) {
		await ctx.watch();
		await writeCjsWrapper();
	} else {
		const result = await ctx.rebuild();
		await writeCjsWrapper();
		await fs.mkdir('./profile', { recursive: true });
		if (result.metafile) {
			await fs.writeFile('./profile/meta.json', JSON.stringify(result.metafile, null, 2));
		}
		await ctx.dispose();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
