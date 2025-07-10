import * as vscode from 'vscode';
import SnippetEditorProvider from '../ui/bufferEditor';
import { showVariableQuickPick } from '../utils/user';

export default function initSnippetFeatureCommands(
	context: vscode.ExtensionContext,
	provider: SnippetEditorProvider
) {
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(provider.handleDocumentChange, provider)
	);

	// Tabstops, Placeholders, and Choices
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			'snippetstudio.editor.insertTabStop',
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new vscode.SnippetString(`\\\$${getNextFeatureNumber(editor)}$0`),
					editor.selection.active
				);
			}
		),
		vscode.commands.registerTextEditorCommand(
			'snippetstudio.editor.insertPlaceholder',
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new vscode.SnippetString(
						`\\\${${getNextFeatureNumber(editor)}:\${2:placeholder}}$0`
					),
					editor.selection.active
				);
			}
		),
		vscode.commands.registerTextEditorCommand(
			'snippetstudio.editor.insertChoice',
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new vscode.SnippetString(
						`\\\${${getNextFeatureNumber(editor)}|\${2:choice},\${3:choice}|}$0`
					),
					editor.selection.active
				);
			}
		)
	);

	// Snippet Insertion Variables and Variables with Placeholders
	if (
		vscode.workspace
			.getConfiguration('snippetstudio')
			.get<boolean>('editor.useQuickPickForVariableInsertion')
	) {
		context.subscriptions.push(
			vscode.commands.registerTextEditorCommand(
				'snippetstudio.editor.insertVariable',
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					const variable = await showVariableQuickPick();
					if (variable !== undefined) {
						editor.insertSnippet(
							new vscode.SnippetString(`\\\$${variable}`),
							editor.selection.active
						);
					}
				}
			),
			vscode.commands.registerTextEditorCommand(
				'snippetstudio.editor.insertVariablePlaceholder',
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					const variable = await showVariableQuickPick();
					if (variable !== undefined) {
						editor.insertSnippet(
							new vscode.SnippetString(`\\\${${variable}:\${1:placeholder}}$0`),
							editor.selection.active
						);
					}
				}
			)
		);
	} else {
		context.subscriptions.push(
			vscode.commands.registerTextEditorCommand(
				'snippetstudio.editor.insertVariable',
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					editor.insertSnippet(
						new vscode.SnippetString(`$\${1|${variableList()}|}$0`),
						editor.selection.active
					);
				}
			),
			vscode.commands.registerTextEditorCommand(
				'snippetstudio.editor.insertVariablePlaceholder',
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					editor.insertSnippet(
						new vscode.SnippetString(
							`\\\${\${1|${variableList()}|}:\${2:placeholder}}$0`
						),
						editor.selection.active
					);
				}
			)
		);
	}
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			'snippetstudio.editor.insertPlaceholderWithTranformation',
			async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				const featureId = getNextFeatureNumber(editor);
				editor.insertSnippet(
					new vscode.SnippetString(
						`\\\${${featureId}/(.*)/\\\${${featureId}:/\${2|capitalize,upcase,downcase,pascalcase,camelcase|}}/}$0`
					),
					editor.selection.active
				);
			}
		)
	);

	// Feature Snippets
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ scheme: 'snippetstudio' },
			{
				provideCompletionItems(document, position, token, context) {
					const id = '${1:id}';
					const source =
						'[Source: VS Code Documentation](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_snippet-syntax)';

					const tabstop = new vscode.CompletionItem(
						'tabstop',
						vscode.CompletionItemKind.Event
					);
					tabstop.insertText = new vscode.SnippetString(`\\\$${id}$0`);
					tabstop.detail = 'tabstop snippet insertion feature';
					tabstop.documentation = new vscode.MarkdownString(
						`With tabstops, you can make the editor cursor move inside a snippet. Use $1, $2 to specify cursor locations. The number is the order in which tabstops will be visited, whereas $0 denotes the final cursor position. Multiple occurrences of the same tabstop are linked and updated in sync. ${source}`
					);

					const placeholder = new vscode.CompletionItem(
						'placeholder',
						vscode.CompletionItemKind.Event
					);
					placeholder.insertText = new vscode.SnippetString(
						`\\\${${id}:\${2:placeholder}}$0`
					);
					placeholder.detail = 'placeholder snippet insertion feature';
					placeholder.documentation = new vscode.MarkdownString(
						`Placeholders are tabstops with values, like \${1:foo}. The placeholder text will be inserted and selected such that it can be easily changed. Placeholders can be nested, like \${1:another \${2:placeholder}}. ${source}`
					);

					const choice = new vscode.CompletionItem(
						'choice',
						vscode.CompletionItemKind.Event
					);
					choice.insertText = new vscode.SnippetString(
						`\\\${${id}|\${2:choice},\${3:choice}|}$0`
					);
					choice.detail = 'choice snippet insertion feature';
					choice.documentation = new vscode.MarkdownString(
						`Placeholders can have choices as values. The syntax is a comma-separated enumeration of values, enclosed with the pipe-character, for example \${1|one,two,three|}. When the snippet is inserted and the placeholder selected, choices will prompt the user to pick one of the values. ${source}`
					);

					const variable = new vscode.CompletionItem(
						'variable',
						vscode.CompletionItemKind.Event
					);
					variable.insertText = new vscode.SnippetString(`$\${1|${variableList()}|}$0`);
					variable.detail = 'variable snippet insertion feature';
					variable.documentation = new vscode.MarkdownString(
						`With $name, you can insert the value of a variable. When a variable is unknown (that is, its name isn't defined) the name of the variable is inserted and it is transformed into a placeholder. ${source}`
					);

					const variablePlaceholder = new vscode.CompletionItem(
						'variablePlaceholder',
						vscode.CompletionItemKind.Event
					);
					variablePlaceholder.insertText = new vscode.SnippetString(
						`\\\${\${1|${variableList()}|}:\${2:placeholder}}$0`
					);
					variablePlaceholder.detail = 'variablePlaceholder snippet insertion feature';
					variablePlaceholder.documentation = new vscode.MarkdownString(
						`With \${name:default}, you can insert the value of a variable. When a variable isn't set, its default or the empty string is inserted. When a variable is unknown (that is, its name isn't defined) the name of the variable is inserted and it is transformed into a placeholder. ${source}`
					);

					const placeholderTransform = new vscode.CompletionItem(
						'placeholderTransform',
						vscode.CompletionItemKind.Event
					);
					placeholderTransform.insertText = new vscode.SnippetString(
						`\\\${${id}/(.*)/\\\${${id}:/\${2|capitalize,upcase,downcase,pascalcase,camelcase|}}/}$0`
					);
					placeholderTransform.detail = 'placeholderTransform snippet insertion feature';
					placeholderTransform.documentation = new vscode.MarkdownString(
						`A transformation of a placeholder allows changing the inserted text for the placeholder when moving to the next tab stop. The inserted text is matched with the regular expression and the match or matches - depending on the options - are replaced with the specified replacement format text. Every occurrence of a placeholder can define its own transformation independently using the value of the first placeholder. ${source}`
					);

					return [
						tabstop,
						placeholder,
						choice,
						variable,
						variablePlaceholder,
						placeholderTransform,
					];
				},
			}
		)
	);
}

function getNextFeatureNumber(editor: vscode.TextEditor): string | number {
	const regex = /(?<!\\)\$\{?(\d{1,2})/g;
	const text = editor.document.getText();

	let max = 0;
	for (const match of text.matchAll(regex)) {
		const number = parseInt(match[1], 10);
		if (!isNaN(number)) {
			max = Math.max(max, number);
		}
	}

	if (
		vscode.workspace
			.getConfiguration('snippetstudio')
			.get<boolean>('editor.autoFillSnippetFeatureIds')
	) {
		return max + 1;
	}

	return `\${1:${max + 1}}`;
}

function variableList(): string {
	return 'TM_SELECTED_TEXT,TM_CURRENT_LINE,TM_CURRENT_WORD,TM_LINE_INDEX,TM_LINE_NUMBER,TM_FILENAME,TM_FILENAME_BASE,TM_DIRECTORY,TM_FILEPATH,RELATIVE_FILEPATH,CLIPBOARD,WORKSPACE_NAME,WORKSPACE_FOLDER,CURSOR_INDEX,CURSOR_NUMBER,CURRENT_YEAR,CURRENT_YEAR_SHORT,CURRENT_MONTH,CURRENT_MONTH_NAME,CURRENT_MONTH_NAME_SHORT,CURRENT_DATE,CURRENT_DAY_NAME,CURRENT_DAY_NAME_SHORT,CURRENT_HOUR,CURRENT_MINUTE,CURRENT_SECOND,CURRENT_SECONDS_UNIX,CURRENT_TIMEZONE_OFFSET,RANDOM,RANDOM_HEX,UUID,BLOCK_COMMENT_START,BLOCK_COMMENT_END,LINE_COMMENT';
}
