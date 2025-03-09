import * as vscode from "vscode";
import SnippetEditorProvider from "../ui/bufferEditor";
import { getCurrentUri } from "../utils/fsInfo";
import { writeSnippet } from "../snippets/updateSnippets";
import { VSCodeSnippet } from "../types/snippetTypes";

function initSnippetEditorCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.saveSnippet', async () => {
            if (vscode.window.activeTextEditor?.document.uri.scheme === 'snippetstudio') {
                const body = vscode.window.activeTextEditor.document.getText().split(/\r\n|\r|\n/);
                const data = provider.getSnippetData();
                if (data === undefined) {
                    vscode.window.showErrorMessage("Cannot save snippet without snippet data");
                    return;
                }
                
                const snippet: VSCodeSnippet = { prefix: data.prefix, body };
                if (data.description) {
                    snippet.description = data.description;
                }
                if (data.scope) {
                    snippet.scope = data.scope;
                }
                writeSnippet(data.filename, data.snippetTitle, snippet);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                
            }
        }),
        vscode.commands.registerCommand('snippetstudio.cancelSnippet', () => {
            const uri = getCurrentUri();
            
            if (uri) {
                provider.delete(uri);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        })
    );

    vscode.window.onDidChangeActiveTextEditor(editor => {
        vscode.commands.executeCommand(
            'setContext', 
            'snippetstudio.editorVisible', 
            editor?.document.uri.scheme === "snippetstudio"
        );
    });
}

let editorCount = 0;

export function newSnippetEditorUri(langId: string = "plaintext", showScope: boolean = true): vscode.Uri {
    return vscode.Uri.from({
        scheme: "snippetstudio",
        path: `/snippets/snippet-${++editorCount}`,
        query: `type=${langId}&showScope=${showScope}`
    });
}

export default initSnippetEditorCommands;