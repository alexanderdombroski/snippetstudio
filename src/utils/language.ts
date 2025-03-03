import * as vscode from 'vscode';

async function selectLanguage(): Promise<string | undefined> {
    const languages = [
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C++',
        'C#',
        'Go',
        'Rust',
        // Add more languages as needed
    ];

    return await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select a language',
        canPickMany: false
    });
}

function getCurrentLanguage(): string | undefined {
    return vscode.window.activeTextEditor?.document.languageId;
}

export { selectLanguage, getCurrentLanguage };