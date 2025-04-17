import * as vscode from "vscode";
import getOctokitClient from '../utils/octokit';
import { getFileName, mergeSnippetFiles } from "./newSnippetFile";

async function createGist(context: vscode.ExtensionContext) {
    const client = await getOctokitClient(context);

    const filename = (await getFileName()) + ".code-snippets";
    if (filename === undefined) {
        return;
    }

    const snippetsToExport = await mergeSnippetFiles();
    if (snippetsToExport === undefined) {
        return;
    }

    const fileContent = JSON.stringify(snippetsToExport, null, 2);

    let desc = await vscode.window.showInputBox({prompt: "Optional: Type a desc"});
    const msg = "Created using SnippetStudio";
    desc = desc ? `${desc.trim()} | ${msg}` : msg;

    const response = await client.gists.create({
        files: { 
            [filename]: {
                content: fileContent 
            }
        },
        description: desc,
        public: true
    });

    vscode.window.showInformationMessage(`${filename} saved in ${response.data.html_url}.`);
}


export { createGist };