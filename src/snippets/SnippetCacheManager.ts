import type { VSCodeSnippets } from '../types';
import { isExtensionSnippetPath } from '../utils/fsInfo';
import { readSnippetFile } from '../utils/jsoncFilesIO';

let cacheManager: SnippetCacheManager;

/** Returns the singleton cache manager */
export function getCacheManager(): SnippetCacheManager {
	cacheManager ??= new SnippetCacheManager();
	return cacheManager;
}

/** Stores snippet data in memory to reduce frequent file io */
export default class SnippetCacheManager {
	private updates = new Set<string>();
	private snippetFiles = new Map<string, VSCodeSnippets | null>();

	/** Rereads all files */
	async hardRefresh() {
		const tasks: Promise<void>[] = [];
		for (const file in this.snippetFiles.keys()) {
			if (this.snippetFiles.get(file)) {
				tasks.push(this.addSnippets(file, { isExtensionSnippet: isExtensionSnippetPath(file) }));
			}
		}
		await Promise.all(tasks);
	}

	/** Adds the filepath to the map */
	async addFile(file: string) {
		if (this.snippetFiles.has(file)) return;
		this.snippetFiles.set(file, null);
	}

	/** Reread the file and update the cache */
	async addSnippets(file: string, options?: { isExtensionSnippet?: boolean; showError?: boolean }) {
		if (this.updates.has(file)) return;
		this.updates.add(file);
		const snippets = await readSnippetFile(file, {
			tryFlatten: options?.isExtensionSnippet,
			showError: options?.showError,
		});
		this.snippetFiles.set(file, snippets ?? errorObject);
		this.updates.delete(file);
	}

	/** Remove a file from cache */
	remove(file: string) {
		this.snippetFiles.delete(file);
	}

	/** Gets cached snippets, or reads them fresh */
	async get(
		file: string,
		options?: { isExtensionSnippet?: boolean; showError?: boolean }
	): Promise<VSCodeSnippets | null> {
		const cachedSnippets = this.snippetFiles.get(file);
		if (cachedSnippets) return cachedSnippets;
		await this.addSnippets(file, options);
		return this.snippetFiles.get(file) ?? null;
	}
}

const errorObject = {
	'file incorrect format': {
		body: 'Need to fix json file!',
		prefix: 'error',
	},
} as const;
