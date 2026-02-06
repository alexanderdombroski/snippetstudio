import type { SnippetDataV2 } from '../../types';

/** Singleton class for storing snippet data to be shared between snippet data webview and snippet editor */
export default class SnippetDataManager {
	private _dataMap: Map<string, SnippetDataV2> = new Map();

	/** gets snippetdata by uri */
	getData(uri: string): SnippetDataV2 | undefined {
		return this._dataMap.get(uri);
	}

	/** stores snippetdata by uri */
	setData(uri: string, snippetData: SnippetDataV2) {
		this._dataMap.set(uri, snippetData);
	}

	/** change the snippet data already stored */
	setPartialData<K extends keyof SnippetDataV2>(uri: string, part: K, value: SnippetDataV2[K]) {
		const snippetData = this._dataMap.get(uri);
		if (snippetData) {
			snippetData[part] = value;
		}
	}

	/** deletes snippetdata given the uri key */
	deleteData(uri: string) {
		if (this._dataMap.has(uri)) {
			this._dataMap.delete(uri);
		}
	}

	/** confirms if snippet data is already associated with a uri */
	hasKey(uri: string): boolean {
		return this._dataMap.has(uri);
	}
}
