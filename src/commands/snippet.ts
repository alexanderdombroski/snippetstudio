import * as vscode from "vscode";
import onDoubleClick from "./doubleClickHandler";
import { deleteSnippet } from "../snippets/updateSnippets";
import { TreeSnippet } from "../ui/templates";
import { getCurrentLanguage } from "../utils/language";
import SnippetEditorProvider from "../ui/bufferEditor";
import { newSnippetEditorUri } from "./snippetEditor";
import { getGlobalLangFile } from "../utils/fsInfo";

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
            await newGlobalLangSnippet(snippetEditorProvider);
            vscode.commands.executeCommand("snippetstudio.refresh");
        })
    );
    // Edit Snippet
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.editSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
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

async function newGlobalLangSnippet(provider: SnippetEditorProvider) {
    try {
        const langId = getCurrentLanguage() ?? "plaintext";
        const uri = newSnippetEditorUri(langId, false);

        await provider.mountSnippet(uri, {
            filename: getGlobalLangFile(langId),
            snippetTitle: "",
            prefix: ""
        });
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