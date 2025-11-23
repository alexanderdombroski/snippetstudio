use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::to_value;
use serde_json::Value;

#[wasm_bindgen]
pub fn extract_snippets(json_input: &str) -> JsValue {
    return match serde_json::from_str::<Value>(json_input) {
        Ok(v) => {
            let snippets_opt = v.get("contributes").and_then(|c| c.get("snippets"));
            if let Some(Value::Array(_)) = snippets_opt {
                return to_value(snippets_opt.unwrap()).unwrap_or(JsValue::UNDEFINED)
            }
            JsValue::UNDEFINED
        },
        Err(_) => JsValue::UNDEFINED,
    }
}
