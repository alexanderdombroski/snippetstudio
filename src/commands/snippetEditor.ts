import * as vscode from "vscode";
import SnippetEditorProvider from "../ui/bufferEditor";


let editorCount = 0;

function initSnippetEditorCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.openEditor", (langId: string = "plaintext", content: string[] = []) => {
            openTempEditor(provider, langId, content);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.saveSnippet', async () => {
            if (vscode.window.activeTextEditor?.document.uri.scheme === 'snippetstudio') {
                const updatedContent = vscode.window.activeTextEditor.document.getText().split(/\r\n|\r|\n/);
                // Process content and save (your logic here)
                console.log('Saved:', updatedContent);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        }),
        vscode.commands.registerCommand('snippetstudio.cancelSnippet', () => {
            const uri = vscode.window.activeTextEditor?.document.uri;
            
            if (uri) {
                provider.delete(uri);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        })
    );

    vscode.workspace.onDidCloseTextDocument(document => {
        if (document.uri.scheme === 'snippetstudio') {
            provider.delete(document.uri);
        }
    });
    vscode.window.onDidChangeActiveTextEditor(editor => {
        vscode.commands.executeCommand(
            'setContext', 
            'snippetstudio.editorVisible', 
            editor?.document.uri.scheme === "snippetstudio"
        );
    });
}

async function openTempEditor(provider: SnippetEditorProvider, langId: string, content: string[] = []) {
    try {
        const uri = vscode.Uri.from({
            scheme: "snippetstudio",
            path: `/snippets/snippet-${++editorCount}`,
            query: `type=${langId}`
        });

        provider.createFile(uri, content.join('\n'));
        const doc = await vscode.workspace.openTextDocument(uri);
        vscode.languages.setTextDocumentLanguage(doc, langId);
        await vscode.window.showTextDocument(doc, {viewColumn: vscode.ViewColumn.Active, preview: false});
        return doc;
    } catch (error) {
        vscode.window.showErrorMessage(`Error creating temp editor: ${error}`);
        return undefined;
    }
}

async function loadSnippet() {
    
}

export default initSnippetEditorCommands;