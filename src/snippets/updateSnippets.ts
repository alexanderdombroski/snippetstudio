import * as vscode from "vscode";
import fs from "fs";
import { VSCodeSnippets } from "../types/snippetTypes";
import { readSnippetFile, writeSnippetFile } from "../utils/jsoncFilesIO";
import { resolve } from "path";


// -------------------------- CRUD operations --------------------------

async function createSnippet(filepath: string) {

}

async function editSnippet(filepath: string) {

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




// -------------------------- Get Content From Buffer -------------------------- //
async function getSnippetContent(langId: string, prevContent: string[] = []): Promise<string[] | undefined> {
    const buffer = await vscode.workspace.openTextDocument({ 
        language: langId, 
        content: prevContent.join("\n")
    });

    vscode.window.showTextDocument(buffer);

    return new Promise<string[] | undefined>((resolve) => {
        const disposable = vscode.workspace.onDidSaveTextDocument((savedDocument) => {
            // File is saved
            if (savedDocument === buffer) {
                disposable.dispose(); // Stop listening
                resolve(buffer.getText().split(/\r\n|\r|\n/));
            }

        });
        // File closed without saving
        const closeDisposable = vscode.window.onDidChangeVisibleTextEditors((editors) => {
            if (!editors.includes(vscode.window.activeTextEditor!)) {
                if (vscode.window.activeTextEditor?.document === buffer) {
                    closeDisposable.dispose();
                    disposable.dispose();
                    resolve(undefined);
                }
            }
        });
    });
}

export { deleteSnippet };