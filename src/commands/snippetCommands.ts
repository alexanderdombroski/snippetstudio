import * as vscode from "vscode";

function initSnippetCommands(context: vscode.ExtensionContext) {
    // Show Snippets view
    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.openView', () => {
            vscode.commands.executeCommand('workbench.view.extension.snippet-manager-view');
        })
    );

     
    context.subscriptions.push(vscode.commands.registerCommand('snippetstudio.showSnippetBody', (body: string) => {
        // Display the snippet body (e.g., in an information message or a webview)
        vscode.window.showInformationMessage(body); // Example: Display in an info message
    }));

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
}

export default initSnippetCommands;