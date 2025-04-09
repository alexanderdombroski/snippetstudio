import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import { createGlobalLangFile, createGlobalSnippetsFile, createLocalSnippetsFile, exportSnippets } from "../snippets/newSnippetFile";
import onDoubleClick from "./doubleClickHandler";


function initSnippetFileCommands(context: vscode.ExtensionContext) {
    // Open Snippets file
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.file.open", async (item: vscode.TreeItem) => {
            await openSnippetFile(item.description);
        }),
        vscode.commands.registerCommand("snippetstudio.file.openFromDouble", onDoubleClick(async (item: vscode.TreeItem) => {
            console.log("RAN");
            await openSnippetFile(item.description);
        }))
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

    // Export Snippet Files
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.snippet.export", exportSnippets)
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

async function openSnippetFile(filename: string|boolean|undefined) {
    try {
        if (filename) {
            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(`${filename}`));
            await vscode.window.showTextDocument(document);
        } else {
            vscode.window.showErrorMessage("Could not find file path.");
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to open snippet file: ${error.message}`);
    }
}

export default initSnippetFileCommands;