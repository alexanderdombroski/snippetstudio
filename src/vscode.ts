// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// Using a wrapper fixes esbuild's tendency to import vscode multiple times when chunking
import * as vscode from 'vscode';

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
