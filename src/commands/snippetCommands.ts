import * as vscode from "vscode";
import onDoubleClick from "./doubleClickHandler";

function initSnippetCommands(context: vscode.ExtensionContext) {
    // Show Snippets view
    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.openView', () => {
            vscode.commands.executeCommand('workbench.view.extension.snippet-manager-view');
        })
    );

    // Open Snippets file
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.openSnippetFile", async (item: vscode.TreeItem) => {
            try {
                if (item.description) {
                    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(`${item.description}`));
                    await vscode.window.showTextDocument(document);
                } else {
                    vscode.window.showErrorMessage("Could not find file path.");
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to open snippet file: ${error.message}`);
            }
        })
    );

    // Show Snippet Body
    const showSnippetOnDoubleClick = onDoubleClick((item: vscode.TreeItem) => {
        vscode.window.showInformationMessage(item.tooltip?.toString() ?? "");
    });
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.showSnippetBody", (item: vscode.TreeItem) => {
            showSnippetOnDoubleClick(item);
        })
    );


    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.openSettings", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.addGlobalSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.deleteSnippetFile", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.editSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.deleteSnippet", () => {
            vscode.window.showErrorMessage("Not implimented yet!");
        })
    );
    


}

export default initSnippetCommands;