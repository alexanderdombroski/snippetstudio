import * as vscode from 'vscode';

let langIds: string[] = [];
(async function loadLangs() {
    langIds.push(...await vscode.languages.getLanguages());
})();

async function selectLanguage(): Promise<string | undefined> {
    return await vscode.window.showQuickPick(langIds, {
        placeHolder: 'Select a language',
        canPickMany: false
    });
}

function getCurrentLanguage(): string | undefined {
    return vscode.window.activeTextEditor?.document.languageId;
}



export { selectLanguage, getCurrentLanguage, langIds};