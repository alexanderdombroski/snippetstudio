import * as vscode from "vscode";

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

function getSelection(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined || editor.selection.isEmpty) {
        return;
    }

    return editor.document.getText(editor.selection);
}

export { getConfirmation, getSelection };