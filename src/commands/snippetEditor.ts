import * as vscode from "vscode";
import SnippetEditorProvider from "../ui/bufferEditor";
import { getCurrentUri } from "../utils/fsInfo";
import { writeSnippet } from "../snippets/updateSnippets";
import { VSCodeSnippet } from "../types/snippetTypes";
import { titleCase } from "../utils/string";
import { createFile } from "../snippets/newSnippetFile";

function initSnippetEditorCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    // Close old tabs
    vscode.window.tabGroups.all.forEach(group => group.tabs.forEach(tab => {
        if (tab.input instanceof vscode.TabInputText && tab.input.uri.scheme === "snippetstudio") {
            vscode.window.tabGroups.close(tab);
        }
    }));
    
    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.editor.save', async () => {
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
                const capitalize = vscode.workspace.getConfiguration("snippetstudio").get<boolean>("autoCapitalizeSnippetName");
                if (vscode.workspace.getConfiguration("snippetstudio").get<boolean>("autoCreateSnippetFiles")) {
                    await createFile(data.filename, false);
                }
                writeSnippet(data.filename, capitalize ? titleCase(data.snippetTitle) : data.snippetTitle, snippet);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                vscode.commands.executeCommand("snippetstudio.refresh");
            }
        }),
        vscode.commands.registerCommand('snippetstudio.editor.cancel', () => {
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