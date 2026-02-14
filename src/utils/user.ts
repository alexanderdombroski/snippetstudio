// -------------------------------------------------------------------
// ---------- Lazy Loaded - Only import with await import() ----------
// -------------------------------------------------------------------

import type { SaveDialogOptions, TextEditor, Selection as SelectionType } from 'vscode';
import vscode, {
	getConfiguration,
	showErrorMessage,
	showInformationMessage,
	showInputBox,
	showQuickPick,
	Uri,
	showSaveDialog,
	executeCommand,
	Selection,
	Position,
} from '../vscode';
import { getDownloadsDirPath, getWorkspaceFolder } from './fsInfo';
import path from 'node:path';
import { getActiveProfileSnippetsDir } from './profile';

/** requires the user to answer a Y/n question in a modal */
async function getConfirmation(question: string): Promise<boolean> {
	// Confirmation message
	const confirmation = await showInformationMessage(question, { modal: true }, 'Yes', 'No');
	return confirmation === 'Yes';
}

/** returns user's highlighted text */
async function getSelection(): Promise<string | undefined> {
	const editor = vscode.window.activeTextEditor;
	if (editor === undefined || editor.selection.isEmpty) {
		return;
	}

	const autoUntab = getConfiguration('snippetstudio').get<boolean>(
		'cleanupSnippetSelection',
		false
	);
	if (autoUntab) {
		return await _unTabMultiline(editor.selection, editor);
	} else {
		return editor.document.getText(editor.selection);
	}
}
/** gets savepath via file explorer */
async function getSavePathFromDialog(
	basename: string,
	startingDir = getDownloadsDirPath()
): Promise<string | undefined> {
	const defaultUri = Uri.file(path.join(startingDir, basename));

	const options: SaveDialogOptions = {
		title: `Save ${basename}`,
		defaultUri,
		saveLabel: 'Save',
	};

	const fileUri = await showSaveDialog(options);
	return fileUri?.fsPath;
}

/** gets a cleaned filename from the user */
async function getFileName(
	prompt: string = 'type a filename',
	silent?: boolean
): Promise<string | undefined> {
	let name = await showInputBox({ prompt });
	if (name === undefined) {
		!silent && showInformationMessage('Skipped file creation.');
		return;
	}
	name = name?.trim();
	const regex = /^[a-zA-Z0-9_-]+$/;
	if (name && !regex.test(name)) {
		!silent && showErrorMessage('Only use characters, hyphens, numbers and/or underscores.');
		return;
	}
	return name;
}

/** Choose file name, export location, and return a filepath */
async function getSavePath(): Promise<string | undefined> {
	const filename = (await getFileName()) + '.code-snippets';
	if (filename === 'undefined.code-snippets') {
		return;
	}

	// Get Save Path
	let savePath;
	const config = getConfiguration('snippetstudio');
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
				showErrorMessage(
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

/** Returns the base path to save a code snippets file */
async function chooseLocalGlobal(): Promise<string | undefined> {
	const locations = [{ label: 'Downloads', description: getDownloadsDirPath() }];
	const globalPath = await getActiveProfileSnippetsDir();
	locations.push({ label: 'Global', description: globalPath });
	const projectPath = getWorkspaceFolder();
	if (projectPath !== undefined) {
		locations.push({ label: 'Project', description: path.join(projectPath, '.vscode') });
	}
	const choice = await showQuickPick(locations);
	return choice?.description;
}

/** removes an equal amount of leading tabs from every line */
async function _unTabMultiline(selection: SelectionType, editor: TextEditor): Promise<string> {
	if (selection.isEmpty) {
		return '';
	}

	if (!selection.isSingleLine) {
		const start = new Position(selection.start.line, 0);
		selection = new Selection(start, editor.document.lineAt(selection.end.line).range.end);
	}

	await executeCommand('editor.action.indentationToSpaces');
	const selectedText = editor.document.getText(selection);
	const lines = selectedText.split(/\r\n|\r|\n/);
	const spaces = _countMinSpaces(lines);

	return lines.map((line) => line.substring(spaces)).join('\n');
}

/** for every line, find the one with the least amount of spaces */
function _countMinSpaces(lines: string[]): number {
	let minCount = 9999;
	for (let line of lines) {
		if (line.trim().length === 0) {
			continue;
		}

		let count = 0;
		for (let char of line) {
			if (char === ' ') {
				count += 1;
			} else {
				minCount = Math.min(count, minCount);
				break;
			}
		}
	}
	if (minCount === 9999) {
		return 0;
	}
	return minCount;
}

export {
	getConfirmation,
	getSelection,
	getFileName,
	getSavePath,
	chooseLocalGlobal,
	getSavePathFromDialog,
	_unTabMultiline,
};
