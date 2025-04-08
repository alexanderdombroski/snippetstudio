import * as vscode from "vscode";
import SnippetEditorProvider from "../ui/bufferEditor";
import { showVariableQuickPick } from "../utils/user";

export default function initSnippetFeatureCommands(context: vscode.ExtensionContext, provider: SnippetEditorProvider) {
    if (vscode.workspace.getConfiguration("snippetstudio").get<boolean>("editor.autoEscapeDollarSigns")) {
		context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(provider.handleDocumentChange, provider));
	}

    // Tabstops, Placeholders, and Choices
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertTabStop", (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            edit.insert(editor.selection.active, `$${getNextFeatureNumber(editor)}`);
        }),
        vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertPlaceholder", (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            editor.insertSnippet(new vscode.SnippetString(`\\\${${getNextFeatureNumber(editor)}:\${1:placeholder}}$0`), editor.selection.active);
        }),
        vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertChoice", (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            editor.insertSnippet(new vscode.SnippetString(`\\\${${getNextFeatureNumber(editor)}|\${1:choice},\${2:choice}|}$0`), editor.selection.active);
        })
    );

    // Snippet Insertion Variables and Variables with Placeholders
    if (vscode.workspace.getConfiguration("snippetstudio").get<boolean>("editor.useQuickPickForVariableInsertion")) {
        context.subscriptions.push(
            vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertVariable", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
                const variable = await showVariableQuickPick();
                if (variable !== undefined) {
                    editor.insertSnippet(new vscode.SnippetString(`\\\$${variable}`), editor.selection.active);
                }
            }),
            vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertVariablePlaceholder", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
                const variable = await showVariableQuickPick();
                if (variable !== undefined) {
                    editor.insertSnippet(new vscode.SnippetString(`\\\${${variable}:\${1:placeholder}}$0`), editor.selection.active);
                }
            }),
            vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertPlaceholderWithTranformation", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
                const variable = await showVariableQuickPick();
                if (variable !== undefined) {
                    editor.insertSnippet(new vscode.SnippetString(`\\\${\${1:id}}$0`), editor.selection.active);
                }
            })
        );
    } else {
        context.subscriptions.push(
            vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertVariable", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
                editor.insertSnippet(new vscode.SnippetString(`$\${1|${variableList()}|}$0`), editor.selection.active);
            }),
            vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertVariablePlaceholder", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
                editor.insertSnippet(new vscode.SnippetString(`\\\${\${1|${variableList()}|}:\${2:placeholder}}$0`), editor.selection.active);
            })
        );
    }
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand("snippetstudio.editor.insertPlaceholderWithTranformation", async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            editor.insertSnippet(new vscode.SnippetString(`\\\${\${1:id}/(.*)/\\\${\${1:id}:/\${2|capitalize,upcase,downcase,pascalcase,camelcase|}}/}$0`), editor.selection.active);
        })
    );
}

function getNextFeatureNumber(editor: vscode.TextEditor): number {
    const regex = /(?<!\\)\$\{?(\d{1,2})/g;
    const text = editor.document.getText();

    let max = 0;
    for (const match of text.matchAll(regex)) {
        const number = parseInt(match[1], 10);
        if (!isNaN(number)) {
            max = Math.max(max, number);
        }
    }

    return max + 1;
}

function variableList(): string {
    return "TM_SELECTED_TEXT,TM_CURRENT_LINE,TM_CURRENT_WORD,TM_LINE_INDEX,TM_LINE_NUMBER,TM_FILENAME,TM_FILENAME_BASE,TM_DIRECTORY,TM_FILEPATH,RELATIVE_FILEPATH,CLIPBOARD,WORKSPACE_NAME,WORKSPACE_FOLDER,CURSOR_INDEX,CURSOR_NUMBER,CURRENT_YEAR,CURRENT_YEAR_SHORT,CURRENT_MONTH,CURRENT_MONTH_NAME,CURRENT_MONTH_NAME_SHORT,CURRENT_DATE,CURRENT_DAY_NAME,CURRENT_DAY_NAME_SHORT,CURRENT_HOUR,CURRENT_MINUTE,CURRENT_SECOND,CURRENT_SECONDS_UNIX,CURRENT_TIMEZONE_OFFSET,RANDOM,RANDOM_HEX,UUID,BLOCK_COMMENT_START,BLOCK_COMMENT_END,LINE_COMMENT";
}