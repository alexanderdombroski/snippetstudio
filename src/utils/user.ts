import * as vscode from 'vscode';
import { unTabMultiline } from './string';
import { getDownloadsDirPath, getGlobalSnippetFilesDir, getWorkspaceFolder } from './fsInfo';
import path from 'path';

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

async function showVariableQuickPick(): Promise<string | undefined> {
	const variables = [
		// TextMate Variables
		{
			label: 'TM_SELECTED_TEXT',
			description: 'The currently selected text or the empty string',
		},
		{ label: 'TM_CURRENT_LINE', description: 'The contents of the current line' },
		{
			label: 'TM_CURRENT_WORD',
			description: 'The contents of the word under cursor or the empty string',
		},
		{ label: 'TM_LINE_INDEX', description: 'The zero-index based line number' },
		{ label: 'TM_LINE_NUMBER', description: 'The one-index based line number' },
		{ label: 'TM_FILENAME', description: 'The filename of the current document' },
		{
			label: 'TM_FILENAME_BASE',
			description: 'The filename of the current document without its extensions',
		},
		{ label: 'TM_DIRECTORY', description: 'The directory of the current document' },
		{ label: 'TM_FILEPATH', description: 'The full file path of the current document' },
		{
			label: 'RELATIVE_FILEPATH',
			description:
				'The relative (to the opened workspace or folder) file path of the current document',
		},
		{ label: 'CLIPBOARD', description: 'The contents of your clipboard' },
		{ label: 'WORKSPACE_NAME', description: 'The name of the opened workspace or folder' },
		{ label: 'WORKSPACE_FOLDER', description: 'The path of the opened workspace or folder' },
		{ label: 'CURSOR_INDEX', description: 'The zero-index based cursor number' },
		{ label: 'CURSOR_NUMBER', description: 'The one-index based cursor number' },
		// Time
		{ label: 'CURRENT_YEAR', description: 'The current year' },
		{ label: 'CURRENT_YEAR_SHORT', description: "The current year's last two digits" },
		{ label: 'CURRENT_MONTH', description: "The month as two digits (example '02')" },
		{ label: 'CURRENT_MONTH_NAME', description: "The full name of the month (example 'July')" },
		{
			label: 'CURRENT_MONTH_NAME_SHORT',
			description: "The short name of the month (example 'Jul')",
		},
		{ label: 'CURRENT_DATE', description: "The day of the month as two digits (example '08')" },
		{ label: 'CURRENT_DAY_NAME', description: "The name of day (example 'Monday')" },
		{
			label: 'CURRENT_DAY_NAME_SHORT',
			description: "The short name of the day (example 'Mon')",
		},
		{ label: 'CURRENT_HOUR', description: 'The current hour in 24-hour clock format' },
		{ label: 'CURRENT_MINUTE', description: 'The current minute as two digits' },
		{ label: 'CURRENT_SECOND', description: 'The current second as two digits' },
		{
			label: 'CURRENT_SECONDS_UNIX',
			description: 'The number of seconds since the Unix epoch',
		},
		{
			label: 'CURRENT_TIMEZONE_OFFSET',
			description: 'The current UTC time zone offset as +HH:MM or -HH:MM (example -07:00).',
		},
		// Random
		{ label: 'RANDOM', description: '6 random Base-10 digits' },
		{ label: 'RANDOM_HEX', description: '6 random Base-16 digits' },
		{ label: 'UUID', description: 'A Version 4 UUID' },
		// Comments
		{ label: 'BLOCK_COMMENT_START', description: 'Example output: in PHP /* or in HTML <!--' },
		{ label: 'BLOCK_COMMENT_END', description: 'Example output: in PHP */ or in HTML -->' },
		{ label: 'LINE_COMMENT', description: 'Example output: in PHP //' },
	];

	const selectedVariable = await vscode.window.showQuickPick(variables, {
		placeHolder: 'Select a snippet variable',
	});

	return selectedVariable?.label;
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

async function getSavePath() {
	const { getFileName } = await import('../snippets/newSnippetFile.js');
	const filename = (await getFileName()) + '.code-snippets';
	if (filename === undefined) {
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

async function chooseLocalGlobal(): Promise<string | undefined> {
	const locations = [{ label: 'Downloads', description: getDownloadsDirPath() }];
	const globalPath = getGlobalSnippetFilesDir();
	if (globalPath !== undefined) {
		locations.push({ label: 'Global', description: globalPath });
	}
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
	showVariableQuickPick,
	getSavePath,
	chooseLocalGlobal,
	getSavePathFromDialog,
};
