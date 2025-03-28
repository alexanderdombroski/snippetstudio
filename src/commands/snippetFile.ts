import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { createGlobalLangFile, createGlobalSnippetsFile, createLocalSnippetsFile } from "../snippets/newSnippetFile";


function initSnippetFileCommands(context: vscode.ExtensionContext) {
    // Open Snippets file
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.open", async (item: vscode.TreeItem) => {
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

    // Create Global Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.createGlobalLang", () => {
            createGlobalLangFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
    // Create Local Mixed Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.createProjectSnippets", async () => {
            await createLocalSnippetsFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
    // Create Global Mixed Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.createGlobalSnippets", async () => {
            await createGlobalSnippetsFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );

    // Delete Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.delete", async (treeItem: vscode.TreeItem) => {
            if (!treeItem || !treeItem.description) {
                vscode.window.showErrorMessage('File path not found.');
                return;
            }
            await deleteFile(treeItem.description.toString());
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
}


async function deleteFile(filepath: string) {
    const filename = path.basename(filepath);

    if (!fs.existsSync(filepath)) {
        vscode.window.showErrorMessage(`${filename} File doesn't exits: ${filepath}`);
        return;
    }

    // Confirmation message
    const confirmation = await vscode.window.showInformationMessage(
        `Are you sure you want to delete "${filename}"?`,
        { modal: true },
        'Yes',
        'No'
    );
    if (confirmation !== 'Yes') {
        return;
    }

    try {
        await fs.promises.unlink(filepath); // Use fs.promises.unlink
        vscode.window.showInformationMessage(`Snippet file deleted: ${filename}\n${filepath}`);
        vscode.commands.executeCommand("snippetstudio.refresh");
        vscode.commands.executeCommand("snippetstudio.refreshLocations");
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Error deleting file: ${error.message}`);
        } else {
            vscode.window.showErrorMessage(`An unknown error occurred: ${error}`);
        }
    }
}

export default initSnippetFileCommands;