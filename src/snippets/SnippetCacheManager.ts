import type {
	ExtensionSnippetFilesMap,
	ProfileSnippetsMap,
	SnippetLinks,
	VSCodeSnippets,
} from '../types';
import { isExtensionSnippetPath } from '../utils/fsInfo';
import { readSnippetFile } from '../utils/jsoncFilesIO';
import { getLinkedSnippets } from './links/config';
import {
	locateActiveSnippetFiles,
	locateProfileSnippetFiles,
	locateSnippetFiles,
} from './locateSnippets';

let cacheManager: SnippetCacheManager;

/** Returns the singleton cache manager */
export function getCacheManager(): SnippetCacheManager {
	cacheManager ??= new SnippetCacheManager();
	return cacheManager;
}

/** Stores snippet data in memory to reduce frequent file io */
export default class SnippetCacheManager {
	// Files
	globals: string[] = [];
	locals: string[] = [];
	profile: ProfileSnippetsMap = {};
	extension: ExtensionSnippetFilesMap = {};
	links: SnippetLinks = {};

	// Snippets
	snippets = new Map<string, VSCodeSnippets | null>();

	/** Rereads files opened in the tree */
	async hardRefresh() {
		const tasks: Promise<void>[] = [];
		for (const file of this.snippets.keys()) {
			if (this.snippets.get(file)) {
				tasks.push(this.addSnippets(file, { isExtensionSnippet: isExtensionSnippetPath(file) }));
			}
		}
		await Promise.all(tasks).then();
	}

	/** Adds the filepath to the map */
	async addFile(file: string) {
		if (this.snippets.has(file)) return;
		this.snippets.set(file, null);
	}

	/** Reread the file and update the cache */
	async addSnippets(file: string, options?: { isExtensionSnippet?: boolean; showError?: boolean }) {
		const snippets = await readSnippetFile(file, {
			tryFlatten: options?.isExtensionSnippet,
			showError: options?.showError,
		});
		this.snippets.set(file, snippets ?? errorObject);
	}

	/** Remove a file from cache */
	remove(file: string) {
		this.snippets.delete(file);
	}

	/** Gets cached snippets, or reads them fresh */
	async getSnippets(
		file: string,
		options?: { isExtensionSnippet?: boolean; showError?: boolean }
	): Promise<VSCodeSnippets | null> {
		const cachedSnippets = this.snippets.get(file);
		if (cachedSnippets) return cachedSnippets;
		await this.addSnippets(file, options);
		return this.snippets.get(file) ?? null;
	}

	/** Returns all snippet files */
	getFiles(): string[] {
		return Array.from(this.snippets.keys());
	}

	/** Updates local and global snippet file locations */
	async updateActiveFiles() {
		const [[locals, globals], links] = await Promise.all([
			locateActiveSnippetFiles(),
			getLinkedSnippets(),
		]);

		this.globals = globals;
		this.locals = locals;
		this.links = links;
		globals.forEach((file) => this.addFile(file));
		locals.forEach((file) => this.addFile(file));
	}

	/** Updates extension snippet file locations */
	async updateExtensionFiles() {
		const { findAllExtensionSnippetsFiles } = await import('./extension/locate.js');
		this.extension = await findAllExtensionSnippetsFiles();
		Object.values(this.extension).map(({ files }) =>
			files.forEach(({ path }) => this.addFile(path))
		);
	}

	/** Updates snippet file locations for all profiles */
	async updateProfileFiles() {
		this.profile = await locateProfileSnippetFiles();
		Object.values(this.profile)
			.flat()
			.forEach((file) => this.addFile(file));
	}

	/** Returns snippets of the active language */
	async getLangSnippets() {
		const snippetFiles = await locateSnippetFiles();

		const task = async (file: string): Promise<[string, VSCodeSnippets]> => {
			const snippets = (await this.getSnippets(file)) ?? {};
			return [file, snippets];
		};

		const tasks = snippetFiles.map((file) => task(file));
		const snippetGroups = await Promise.all(tasks);

		return snippetGroups;
	}
}

const errorObject = {
	'file incorrect format': {
		body: 'Need to fix json file!',
		prefix: 'error',
	},
} as const;
