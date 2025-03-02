import * as vscode from 'vscode';

export default async function selectLanguage() {
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

    const selectedLanguage = await vscode.window.showQuickPick(languages, {
        placeHolder: 'Select a language',
        canPickMany: false, // Set to true if you want to allow multiple selections
    });

    if (selectedLanguage) {
        vscode.window.showInformationMessage(`Selected language: ${selectedLanguage}`);
        // Perform actions based on the selected language
    } else {
        vscode.window.showInformationMessage("No language selected");
    }
}

// export function activate(context: vscode.ExtensionContext) {
//     context.subscriptions.push(
//         vscode.commands.registerCommand('myExtension.selectLanguage', selectLanguage)
//     );
// }