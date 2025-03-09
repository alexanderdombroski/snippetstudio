import { SnippetData } from "../types/snippetTypes";

export default class snippetDataManager {

    private _dataMap: Map<string, SnippetData> = new Map();

    constructor() {}

    getData(uri: string): SnippetData | undefined {
        return this._dataMap.get(uri);
    }

    setData(uri: string, snippetData: SnippetData) {
        this._dataMap.set(uri, snippetData);
    }

    deleteData(uri: string) {
        if (this._dataMap.has(uri)) {
            this._dataMap.delete(uri);
        }
    }

}