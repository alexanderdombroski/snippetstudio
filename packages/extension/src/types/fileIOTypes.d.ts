type GenericJson = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
	[key: string]: GenericJson;
}
interface JSONArray extends Array<GenericJson> {}

export type { GenericJson, JSONObject, JSONArray };
