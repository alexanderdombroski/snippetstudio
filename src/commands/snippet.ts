import * as vscode from "vscode";
import onDoubleClick from "./doubleClickHandler";

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
        vscode.commands.registerCommand("snippetstudio.deleteSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );

}

export default initSnippetCommands;