import vscode from '../vscode';
import { unTabMultiline } from './string';
import { getDownloadsDirPath, getWorkspaceFolder } from './fsInfo';
import path from 'node:path';
import { getActiveProfileSnippetsDir } from './profile';

async function getConfirmation(question: string): Promise<boolean> {
	// Confirmation message
	const confirmation = await vscode.window.showInformationMessage(
		question,
		{ modal: true },
		'Yes',
		'No'
	);
	return confirmation === 'Yes';
}

async function getSelection(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (editor === undefined || editor.selection.isEmpty) {
		return;
	}

	const autoUntab = vscode.workspace
		.getConfiguration('snippetstudio')
		.get<boolean>('cleanupSnippetSelection', false);
	if (autoUntab) {
		return await unTabMultiline(editor.selection, editor);
	} else {
		return editor.document.getText(editor.selection);
	}
}

async function getSavePathFromDialog(
	basename: string,
	startingDir = getDownloadsDirPath()
): Promise<string | undefined> {
	const defaultUri = vscode.Uri.file(path.join(startingDir, basename));

	const options: vscode.SaveDialogOptions = {
		title: `Save ${basename}`,
		defaultUri: defaultUri,
		saveLabel: 'Save',
	};

	const fileUri = await vscode.window.showSaveDialog(options);
	return fileUri?.fsPath;
}

async function getFileName(
	prompt: string = 'type a filename',
	silent?: boolean
): Promise<string | undefined> {
	let name = await vscode.window.showInputBox({ prompt });
	if (name === undefined) {
		!silent && vscode.window.showInformationMessage('Skipped file creation.');
		return;
	}
	name = name?.trim();
	const regex = /^[a-zA-Z0-9_-]+$/;
	if (name && !regex.test(name)) {
		!silent &&
			vscode.window.showErrorMessage('Only use characters, hyphens, numbers and/or underscores.');
		return;
	}
	return name;
}

async function getSavePath() {
	const filename = (await getFileName()) + '.code-snippets';
	if (filename === 'undefined.code-snippets') {
		return;
	}

	// Get Save Path
	let savePath;
	const config = vscode.workspace.getConfiguration('snippetstudio');
	const location = config.get<string>('export.location');
	switch (location) {
		case 'choose':
			savePath = await getSavePathFromDialog(filename);
			break;
		case 'downloads':
			savePath = path.join(getDownloadsDirPath(), filename);
			break;
		case 'preconfigured':
			const dirname = config.get<string>('export.preconfiguredExportPath');
			if (dirname === undefined) {
				vscode.window.showErrorMessage(
					'In settings, you must specificy a folder path to save exported snippets to'
				);
				break;
			}
			savePath = path.join(dirname, filename);
			break;
		default:
			break;
	}
	return savePath;
}

/**
 * Returns the base path to save a code snippets file
 */
async function chooseLocalGlobal(): Promise<string | undefined> {
	const locations = [{ label: 'Downloads', description: getDownloadsDirPath() }];
	const globalPath = await getActiveProfileSnippetsDir();
	locations.push({ label: 'Global', description: globalPath });
	const projectPath = getWorkspaceFolder();
	if (projectPath !== undefined) {
		locations.push({ label: 'Project', description: path.join(projectPath, '.vscode') });
	}
	const choice = await vscode.window.showQuickPick(locations);
	return choice?.description;
}

export {
	getConfirmation,
	getSelection,
	getFileName,
	getSavePath,
	chooseLocalGlobal,
	getSavePathFromDialog,
};
