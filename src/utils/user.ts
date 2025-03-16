import * as vscode from "vscode";
import { unTabMultiline } from "./string";

async function getConfirmation(question: string): Promise<boolean> {
    // Confirmation message
    const confirmation = await vscode.window.showInformationMessage(
        question,
        { modal: true },
        'Yes',
        'No'
    );
    return (confirmation === 'Yes');
}

async function getSelection(): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined || editor.selection.isEmpty) {
        return;
    }

    const autoUntab = vscode.workspace.getConfiguration('snippetstudio').get<boolean>('cleanupSnippetSelection', false);
    if (autoUntab) {
        return await unTabMultiline(editor.selection, editor);
    } else {
        return editor.document.getText(editor.selection);
    }

}

export { getConfirmation, getSelection };