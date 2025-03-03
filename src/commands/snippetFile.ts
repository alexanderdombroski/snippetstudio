import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { createGlobalLangFile, createGlobalSnippetsFile, createLocalLangFile, createLocalSnippetsFile } from "../snippets/newSnippetFile";


function initSnippetFileCommands(context: vscode.ExtensionContext) {
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

    // Create Global Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.createGlobalLangFile", () => {
            createGlobalLangFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
    // Create Local Language specific Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.createLocalLangFile", () => {
            createLocalLangFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
    // Create Local Mixed Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.createLocalSnippetsFile", () => {
            createLocalSnippetsFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
    // Create Global Mixed Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.createGlobalSnippetsFile", () => {
            createGlobalSnippetsFile();
            vscode.commands.executeCommand("snippetstudio.refresh");
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );

    // Delete Snippet File
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.deleteSnippetFile", async (treeItem: vscode.TreeItem) => {
            if (!treeItem || !treeItem.description) {
                vscode.window.showErrorMessage('File path not found.');
                return;
            }
            deleteFile(treeItem.description.toString());
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