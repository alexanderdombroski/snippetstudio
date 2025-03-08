import { VSCodeSnippet } from "../types/snippetTypes";
import { readSnippetFile, writeSnippetFile } from "../utils/jsoncFilesIO";
import path from "path";

// -------------------------- CRUD operations --------------------------

async function writeSnippet(filepath: string, titleKey: string, snippet: VSCodeSnippet) {
    const snippets = await readSnippetFile(filepath);
    if (snippets === undefined) {
        console.error(`Read Operation failed. Write operation of ${titleKey} to ${path.basename(filepath)} canceled.`);
        return;
    }
    
    snippets[titleKey] = snippet;
    await writeSnippetFile(filepath, snippets);
}

async function deleteSnippet(filepath: string, titleKey: string) {
    const snippets = await readSnippetFile(filepath);
    if (snippets === undefined) {
        return;
    }

    if (snippets.hasOwnProperty(titleKey)) {
        delete snippets[titleKey];
        await writeSnippetFile(filepath, snippets);
    }
}

export { deleteSnippet, writeSnippet };