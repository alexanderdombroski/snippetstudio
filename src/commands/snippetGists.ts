import * as vscode from "vscode";
import { createGist } from "../snippets/snippetGists";

async function initSnippetGistsCommands(context: vscode.ExtensionContext) {    
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.github.export", async () => {
            createGist(context);
        })
    );
}

export default initSnippetGistsCommands;