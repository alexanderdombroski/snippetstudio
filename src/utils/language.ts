import vscode, { showQuickPick, getLanguages } from '../vscode';

/** Prompts the user to select a language */
async function selectLanguage(): Promise<string | undefined> {
	return await showQuickPick(await getLanguages(), {
		placeHolder: 'Select a language',
		canPickMany: false,
	});
}

/** Gets the language of the current open editor in focus. */
function getCurrentLanguage(): string | undefined {
	return vscode.window.activeTextEditor?.document.languageId;
}

export { selectLanguage, getCurrentLanguage };
