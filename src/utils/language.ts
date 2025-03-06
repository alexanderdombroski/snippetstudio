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


/**
 * Finds the extensions of the selected language
 * 
 * @param langId language identier
 * @returns a promise string[] of language specific file extensions if any are found
 */
function getFileExtensions(langId: string): string[] {
    // const found = langIds.some(lang => lang === langId);
    // if (!found) {
    //     console.log("langs not loaded");
    //     return [];
    // }
    
    // // Check for file associations in user settings
    // const fileAssociations = vscode.workspace.getConfiguration('files.associations');
    
    // // Collect extensions from known associations
    // const extensionsFromSettings = Object.entries(fileAssociations)
    //     .filter(([key, value]) => value === langId)
    //     .map(([key]) => key.startsWith('*.') ? key.slice(1) : key);

    // // If extensions found in settings, return those
    // if (extensionsFromSettings.length > 0) {
    //     return extensionsFromSettings;
    // }

    // const languages = vscode.workspace.textDocuments
    //     .filter(doc => doc.languageId === langId)
    //     .map(doc => {
    //         const ext = doc.fileName.split('.').pop();
    //         return ext ? ext : null;
    //     })
    //     .filter(ext => ext !== null);

    // if (languages.length > 0) {
    //     console.log(`Extensions from open documents for ${langId}:`, languages);
    //     return [...new Set(languages)];
    // }


    // console.log("No extensions found");
    return [];
}

export { selectLanguage, getCurrentLanguage, langIds, getFileExtensions};