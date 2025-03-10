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

export { getConfirmation };