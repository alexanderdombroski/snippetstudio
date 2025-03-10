import * as vscode from "vscode";
import onDoubleClick from "./doubleClickHandler";
import { deleteSnippet, readSnippet } from "../snippets/updateSnippets";
import { TreeSnippet } from "../ui/templates";
import { getCurrentLanguage, selectLanguage } from "../utils/language";
import SnippetEditorProvider from "../ui/bufferEditor";
import { newSnippetEditorUri } from "./snippetEditor";
import { getGlobalLangFile, getLangFromSnippetFilePath } from "../utils/fsInfo";
import path from "path";
import { SnippetData } from "../types/snippetTypes";

function initSnippetCommands(context: vscode.ExtensionContext, snippetEditorProvider: SnippetEditorProvider) {
    // Show Snippet Body
    const showSnippetOnDoubleClick = onDoubleClick((item: vscode.TreeItem) => {
        vscode.window.showInformationMessage(item.tooltip?.toString() ?? "");
    });
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.showSnippetBody", (item: vscode.TreeItem) => {
            showSnippetOnDoubleClick(item);
        })
    );
    

    // Add Global
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.addGlobalSnippet", async () => {
            const langId = getCurrentLanguage() ?? "plaintext";

            await editSnippet(snippetEditorProvider, langId, {
                filename: getGlobalLangFile(langId),
                snippetTitle: "",
                prefix: ""
            });
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.createSnippetAtLocation",  async (item: TreeSnippet) => {
            if (item === undefined || item.description === undefined) {
                return;
            }
            const filename = item.description.toString();
            const langId = getLangFromSnippetFilePath(filename) ?? await selectLanguage() ?? getCurrentLanguage() ?? "plaintext";

            await editSnippet(snippetEditorProvider, langId, {
                filename,
                snippetTitle: "",
                prefix: "",
                scope: langId
            });
        })
    );
    // Edit Snippet
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.editSnippet", async (item: TreeSnippet) => {
            const langId = getCurrentLanguage() ?? "plaintext";
            const snippetTitle = item.description?.toString() ?? "";
            const snippet = await readSnippet(item.path, snippetTitle);
            const snippetData: SnippetData = {
                filename: item.path,
                snippetTitle,
                prefix: item.label,
            };
            if (snippet) {
                if (snippet.description) {
                    snippetData.description = snippet.description;
                }
                if (snippet.scope) {
                    snippetData.scope = snippet.scope;
                }
            }
            const body = Array.isArray(snippet?.body) ? snippet.body.join("\n") : snippet?.body ?? "";
            await editSnippet(snippetEditorProvider, langId, snippetData, body);
        })
    );
    // Delete Snippet
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.deleteSnippet", (item: TreeSnippet) => {
            if (item === undefined || item.description === undefined) {
                return;
            }

            deleteSnippet(item.path, item.description.toString());
            vscode.commands.executeCommand("snippetstudio.refresh");
        })
    );
}

async function editSnippet(provider: SnippetEditorProvider, langId: string, snippetData: SnippetData, body: string = "") {
    try {
        const uri = newSnippetEditorUri(langId, path.extname(snippetData.filename) === ".code-snippets");
        await provider.mountSnippet(uri, snippetData, body);
        const doc = await vscode.workspace.openTextDocument(uri);
        vscode.languages.setTextDocumentLanguage(doc, langId);
        await vscode.window.showTextDocument(doc, {viewColumn: vscode.ViewColumn.Active, preview: false});
        vscode.workspace.onDidCloseTextDocument(document => {
            if (document.uri === doc.uri) {
                provider.delete(doc.uri);
            }
        });
        return doc;
    } catch (error) {
        vscode.window.showErrorMessage(`Error creating temp editor: ${error}`);
        return undefined;
    }
}

export default initSnippetCommands;