import * as vscode from "vscode";
import SnippetEditorProvider from "../ui/bufferEditor";

export default function initSnippetFeatureCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    if (vscode.workspace.getConfiguration("snippetstudio").get<boolean>("editor.autoEscapeDollarSigns") === true) {
		context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(provider.handleDocumentChange, provider));
	}
}