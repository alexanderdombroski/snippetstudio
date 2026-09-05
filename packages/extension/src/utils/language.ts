import vscode, { showQuickPick, getLanguages } from '../vscode';

/** Prompts the user to select a language */
async function selectLanguage(options?: string[]): Promise<string | undefined> {
	const langs = options ?? (await getLanguages());
	const currLangId = getCurrentLanguage();

	const i = langs.indexOf(getCurrentLanguage() as string);
	if (currLangId && i !== -1) {
		langs.splice(i, 1);
		langs.unshift(currLangId);
	}

	return await showQuickPick(langs, {
		placeHolder: 'Select a language',
		canPickMany: false,
	});
}

/** Gets the language of the current open editor in focus. */
function getCurrentLanguage(): string | undefined {
	return vscode.window.activeTextEditor?.document.languageId;
}

export { selectLanguage, getCurrentLanguage };
