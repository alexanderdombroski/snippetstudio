import vscode, { showQuickPick } from '../vscode';

let langIds: string[] = [];
(async function loadLangs() {
	langIds.push(...(await vscode.languages.getLanguages()));
})();

/**
 * Prompts the user to select a language
 */
async function selectLanguage(): Promise<string | undefined> {
	return await showQuickPick(langIds, {
		placeHolder: 'Select a language',
		canPickMany: false,
	});
}

/**
 * Gets the language of the current open editor in focus.
 */
function getCurrentLanguage(): string | undefined {
	return vscode.window.activeTextEditor?.document.languageId;
}

export { selectLanguage, getCurrentLanguage, langIds };
