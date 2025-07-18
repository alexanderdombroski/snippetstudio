type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
	[key: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

type GenericJson = JSONValue;

export { GenericJson };
