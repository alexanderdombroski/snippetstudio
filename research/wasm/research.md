
# Web Assembly

## Intro

Can I improve extension performance if I was WASM/WASI?

VS Code made a npm package `@vscode/wasm-wasi` a while ago for cross platform compatability of WASM, and extend WASM compatabilities.

VS Code extension host is running on:
node: '22.21.1'

Node has very good support for WASM and expirimental support for WASI. ViTest might also support running WASM during tests.

## Use Cases

Improve speed of computation-related tasks (after fileIO)

- Getting a list of extension snippets from all extensions' package.json
- Calculating where to apply text decorations
- Scanning text to know the next insertion feature number to insert

## Tests

### Reading package files

> Q: How much can WASM improve the speed of reading several package.json to locate extesion snippets?

> A: Not enough computation involved, so the overhead makes it slower

## Conclusion

After more reading:

- WASM is only good for number crunching tasks
- Almost always slower for string manipulation
- This extension currently has no need for WASM
