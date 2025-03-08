import * as vscode from "vscode";
import onDoubleClick from "./doubleClickHandler";
import { deleteSnippet } from "../snippets/updateSnippets";
import { TreeSnippet } from "../ui/templates";

function initSnippetCommands(context: vscode.ExtensionContext) {
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
        vscode.commands.registerCommand("snippetstudio.addGlobalSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
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

export default initSnippetCommands;