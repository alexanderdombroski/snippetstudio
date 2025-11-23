// How much can WASM improve the speed of reading several package.json to locate extesions?
// eslint-disable-next-line import/extensions, custom/no-extension-on-imports-except-await
import { extract_snippets } from './rust/pkg/rust.js';

import fs from 'node:fs/promises';
import path from 'node:path';

console.time('read pkgs');

const files = [
	'pkg-csharp.json',
	'pkg-ejs.json',
	'pkg-erlang.json',
	'pkg-go.json',
	'pkg-js-snippets.json',
	'pkg-python.json',
	'pkg-terraform.json',
];

const paths = files.map((file) => path.join(import.meta.dirname, file));

/**
 * read a single package file and return paths
 * @param {string} fp filepath
 * @returns {Promise<string[]|undefined>} filepaths to snippets files
 */
async function task(fp) {
	const content = await fs.readFile(fp, { encoding: 'utf-8' });
	return extract_snippets(content);
}

const tasks = paths.map((fp) => task(fp));

const fileGroups = await Promise.all(tasks);

const snippets = fileGroups.flat().filter((group) => group);

console.timeEnd('read pkgs');

console.log(snippets);
