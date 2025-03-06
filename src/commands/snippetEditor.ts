import * as vscode from "vscode";
// import SnippetContentProvider from "../ui/bufferViewer";
import SnippetEditorProvider from "../ui/bufferEditor";


let editorCount = 0;
// let viewerCount = 0;

function initSnippetEditorCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    context.subscriptions.push(
        vscode.commands.registerCommand("snippetstudio.openEditor", (langId: string = "plaintext", content: string[] = []) => {
            openTempEditor(provider, langId, content);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('snippetstudio.saveSnippet', async () => {
            if (vscode.window.activeTextEditor?.document.uri.scheme === 'snippet-editor') {
                const updatedContent = vscode.window.activeTextEditor.document.getText().split(/\r\n|\r|\n/);
                // Process content and save (your logic here)
                console.log('Saved:', updatedContent);
                vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            }
        }),
        vscode.commands.registerCommand('snippetstudio.cancelSnippet', () => {
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        })
    );

    // context.subscriptions.push(
    //     vscode.commands.registerCommand('snippetstudio.editSnippet', async (snippetContent: string[], langId: string) => {
    //         const uri = vscode.Uri.parse(`snippet-editor://snippet/edit`);
    //         snippetProvider.update(snippetContent.join('\n'), uri, langId);

    //         const doc = await vscode.workspace.openTextDocument(uri);
    //         await vscode.window.showTextDocument(doc);

    //         const result = await vscode.window.showQuickPick(['Save', 'Cancel'], {
    //             placeHolder: 'Save or cancel snippet edit',
    //         });

    //         if (result === 'Save') {
    //             vscode.commands.executeCommand('snippetstudio.saveSnippet');
    //         } else if (result === 'Cancel') {
    //             vscode.commands.executeCommand('snippetstudio.cancelSnippet');
    //         }
    //     })
    // );
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
        await vscode.window.showTextDocument(doc);
        return doc;
    } catch (error) {
        vscode.window.showErrorMessage(`Error creating temp editor: ${error}`);
        return undefined;
    }
}

// async function openTempViewer(context: vscode.ExtensionContext, langId: string, content: string[] = []) {
//     try {
//         const uri = vscode.Uri.from({
//             scheme: "snippetstudio",
//             path: `snippet/view/snippet-${++viewerCount}`,
//             query: `type=${langId}`
//         });
//         const provider = new SnippetContentProvider(content, langId);
//         context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(uri.scheme, provider));

//         const doc = await vscode.workspace.openTextDocument(uri);
//         vscode.languages.setTextDocumentLanguage(doc, langId);
//         await vscode.window.showTextDocument(doc);
//         return doc;
//     } catch (error) {
//         vscode.window.showErrorMessage(`Error creating snippet viewer: ${error}`);
//         return undefined;
//     }
// }

export default initSnippetEditorCommands;