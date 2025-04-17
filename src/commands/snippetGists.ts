import * as vscode from "vscode";
import { createGist, importGist } from "../snippets/snippetGists";

async function initSnippetGistsCommands(context: vscode.ExtensionContext) {    
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.github.export", () => {
            createGist(context);
        }),
        vscode.commands.registerCommand("snippetstudio.github.import", async () => {
            await importGist(context);
            vscode.commands.executeCommand("snippetstudio.refreshLocations");
        })
    );
}

export default initSnippetGistsCommands;