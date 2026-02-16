// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// Using a wrapper fixes esbuild's tendency to import vscode multiple times when chunking
import { createRequire } from 'node:module';
// @ts-expect-error ts(1470) - File will remain ESM
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const vscode: typeof import('vscode') = require('vscode'); // Cursor requires a cjs require of vscode API because this file is bundled as ESM

export const {
	SnippetString,
	CompletionItem,
	MarkdownString,
	Uri,
	ThemeIcon,
	Range,
	Selection,
	TreeItem,
	Position,
	DataTransfer,
	DataTransferItem,
} = vscode;

export const { registerTextEditorCommand, registerCommand, executeCommand } = vscode.commands;

export const { Event } = vscode.CompletionItemKind;

export const { onDidChangeTextDocument, getConfiguration, openTextDocument } = vscode.workspace;

export const {
	showQuickPick,
	showInformationMessage,
	showWarningMessage,
	showErrorMessage,
	showInputBox,
	showTextDocument,
	createTerminal,
	showOpenDialog,
	createQuickPick,
	onDidChangeActiveTextEditor,
	showSaveDialog,
	createTextEditorDecorationType,
} = vscode.window;

export const { getLanguages } = vscode.languages;
export const { openExternal } = vscode.env;

export const { None, Collapsed, Expanded } = vscode.TreeItemCollapsibleState;

export default vscode;
