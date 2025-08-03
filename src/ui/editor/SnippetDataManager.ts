import type { SnippetData } from '../../types';

export default class SnippetDataManager {
	private _dataMap: Map<string, SnippetData> = new Map();

	constructor() {}

	getData(uri: string): SnippetData | undefined {
		return this._dataMap.get(uri);
	}

	setData(uri: string, snippetData: SnippetData) {
		this._dataMap.set(uri, snippetData);
	}

	setPartialData(uri: string, part: keyof SnippetData, value: string) {
		const snippetData = this._dataMap.get(uri);
		if (snippetData) {
			snippetData[part] = value;
		}
	}

	deleteData(uri: string) {
		if (this._dataMap.has(uri)) {
			this._dataMap.delete(uri);
		}
	}

	hasKey(uri: string) {
		return this._dataMap.has(uri);
	}
}
