import { context } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import htmlnano from 'htmlnano';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

const outdir = 'dist';
const outdirPath = path.join(import.meta.dirname, 'dist');

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

/** Step to minifiy HTML file for webview */
async function minifyHTML() {
	const html = await fs.readFile(
		path.join(import.meta.dirname, 'public', 'snippetData.html'),
		'utf8'
	);
	const { html: minifiedHtml } = await htmlnano.process(html, {
		collapseWhitespace: 'all',
		removeComments: 'all',
		minifyJs: true,
		minifySvg: false,
	});
	const newPath = path.join(outdirPath, 'snippetData.html');
	await fs.writeFile(newPath, minifiedHtml);
}

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

	await fs.writeFile(path.join(outdirPath, 'extension.js'), code);
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
			'process.env.IS_PRODUCTION_BUILD': JSON.stringify(production),
		},
		drop: production ? ['console', 'debugger'] : [],
		chunkNames: 'chunks/[name]-[hash]',
		metafile: production,
	});

	await fs.mkdir(outdirPath, { recursive: true });
	await Promise.all([minifyHTML(), writeCjsWrapper()]);
	if (watch) {
		await ctx.watch();
	} else {
		const result = await ctx.rebuild();
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
