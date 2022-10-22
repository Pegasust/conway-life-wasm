mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    /// This is basically a binding to JS's window.alert function
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    let alert_str = format!("Hello, {}!", name);
    alert(&alert_str);
}
