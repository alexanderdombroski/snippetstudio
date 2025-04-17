import * as vscode from "vscode";
import getOctokitClient from "../utils/octokit";

async function initSnippetGistsCommands(context: vscode.ExtensionContext) {
    const client = await getOctokitClient(context);


}

export default initSnippetGistsCommands;