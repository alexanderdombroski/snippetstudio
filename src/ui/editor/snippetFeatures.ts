import vscode, {
	SnippetString,
	CompletionItem,
	MarkdownString,
	registerTextEditorCommand,
	Event,
	onDidChangeTextDocument,
	getConfiguration,
	showQuickPick,
} from '../../vscode';
import type SnippetEditorProvider from './SnippetEditorProvider';

export default function initSnippetFeatureCommands(
	context: vscode.ExtensionContext,
	provider: SnippetEditorProvider
) {
	context.subscriptions.push(onDidChangeTextDocument(provider.handleDocumentChange, provider));

	// Tabstops, Placeholders, and Choices
	context.subscriptions.push(
		registerTextEditorCommand(
			'snippetstudio.editor.insertTabStop',
			// eslint-disable-next-line no-unused-vars
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new SnippetString(`\\\$${getNextFeatureNumber(editor)}$0`),
					editor.selection
				);
			}
		),
		registerTextEditorCommand(
			'snippetstudio.editor.insertPlaceholder',
			// eslint-disable-next-line no-unused-vars
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new SnippetString(
						`\\\${${getNextFeatureNumber(editor)}:\${2:\${TM_SELECTED_TEXT:placeholder}}}$0`
					),
					editor.selection
				);
			}
		),
		registerTextEditorCommand(
			'snippetstudio.editor.insertChoice',
			// eslint-disable-next-line no-unused-vars
			(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				editor.insertSnippet(
					new SnippetString(
						`\\\${${getNextFeatureNumber(editor)}|\${2:\${TM_SELECTED_TEXT:choice}},\${3:choice}|}$0`
					),
					editor.selection
				);
			}
		)
	);

	// Snippet Insertion Variables and Variables with Placeholders
	if (getConfiguration('snippetstudio').get<boolean>('editor.useQuickPickForVariableInsertion')) {
		context.subscriptions.push(
			registerTextEditorCommand(
				'snippetstudio.editor.insertVariable',
				// eslint-disable-next-line no-unused-vars
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					const variable = await showVariableQuickPick();
					if (variable !== undefined) {
						editor.insertSnippet(new SnippetString(`\\\$${variable}`), editor.selection);
					}
				}
			),
			registerTextEditorCommand(
				'snippetstudio.editor.insertVariablePlaceholder',
				// eslint-disable-next-line no-unused-vars
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					const variable = await showVariableQuickPick();
					if (variable !== undefined) {
						editor.insertSnippet(
							new SnippetString(`\\\${${variable}:\${1:\${TM_SELECTED_TEXT:placeholder}}}$0`),
							editor.selection
						);
					}
				}
			)
		);
	} else {
		context.subscriptions.push(
			registerTextEditorCommand(
				'snippetstudio.editor.insertVariable',
				// eslint-disable-next-line no-unused-vars
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					editor.insertSnippet(new SnippetString(`$\${1|${variableList()}|}$0`), editor.selection);
				}
			),
			registerTextEditorCommand(
				'snippetstudio.editor.insertVariablePlaceholder',
				// eslint-disable-next-line no-unused-vars
				async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
					editor.insertSnippet(
						new SnippetString(
							`\\\${\${1|${variableList()}|}:\${2:\${TM_SELECTED_TEXT:placeholder}}}$0`
						),
						editor.selection
					);
				}
			)
		);
	}
	context.subscriptions.push(
		registerTextEditorCommand(
			'snippetstudio.editor.insertPlaceholderWithTranformation',
			// eslint-disable-next-line no-unused-vars
			async (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
				const featureId = getNextFeatureNumber(editor);
				editor.insertSnippet(
					new SnippetString(
						`\\\${${featureId}/(.*)/\\\${${featureId}:/\${2|capitalize,upcase,downcase,pascalcase,camelcase|}}/}$0`
					),
					editor.selection
				);
			}
		)
	);

	// Feature Snippets
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			{ scheme: 'snippetstudio' },
			{
				// eslint-disable-next-line no-unused-vars
				provideCompletionItems(document, position, token, context) {
					const id = '${1:id}';
					const source =
						'[Source: VS Code Documentation](https://code.visualstudio.com/docs/editing/userdefinedsnippets#_snippet-syntax)';

					const tabstop = new CompletionItem('tabstop', Event);
					tabstop.insertText = new SnippetString(`\\\$${id}$0`);
					tabstop.detail = 'tabstop snippet insertion feature';
					tabstop.documentation = new MarkdownString(
						`With tabstops, you can make the editor cursor move inside a snippet. Use $1, $2 to specify cursor locations. The number is the order in which tabstops will be visited, whereas $0 denotes the final cursor position. Multiple occurrences of the same tabstop are linked and updated in sync. ${source}`
					);

					const placeholder = new CompletionItem('placeholder', Event);
					placeholder.insertText = new SnippetString(
						`\\\${${id}:\${2:\${TM_SELECTED_TEXT:placeholder}}}$0`
					);
					placeholder.detail = 'placeholder snippet insertion feature';
					placeholder.documentation = new MarkdownString(
						`Placeholders are tabstops with values, like \${1:foo}. The placeholder text will be inserted and selected such that it can be easily changed. Placeholders can be nested, like \${1:another \${2:placeholder}}. ${source}`
					);

					const choice = new CompletionItem('choice', Event);
					choice.insertText = new SnippetString(
						`\\\${${id}|\${2:\${TM_SELECTED_TEXT:choice}},\${3:choice}|}$0`
					);
					choice.detail = 'choice snippet insertion feature';
					choice.documentation = new MarkdownString(
						`Placeholders can have choices as values. The syntax is a comma-separated enumeration of values, enclosed with the pipe-character, for example \${1|one,two,three|}. When the snippet is inserted and the placeholder selected, choices will prompt the user to pick one of the values. ${source}`
					);

					const variable = new CompletionItem('variable', Event);
					variable.insertText = new SnippetString(`$\${1|${variableList()}|}$0`);
					variable.detail = 'variable snippet insertion feature';
					variable.documentation = new MarkdownString(
						`With $name, you can insert the value of a variable. When a variable is unknown (that is, its name isn't defined) the name of the variable is inserted and it is transformed into a placeholder. ${source}`
					);

					const variablePlaceholder = new CompletionItem('variablePlaceholder', Event);
					variablePlaceholder.insertText = new SnippetString(
						`\\\${\${1|${variableList()}|}:\${2:\${TM_SELECTED_TEXT:placeholder}}}$0`
					);
					variablePlaceholder.detail = 'variablePlaceholder snippet insertion feature';
					variablePlaceholder.documentation = new MarkdownString(
						`With \${name:default}, you can insert the value of a variable. When a variable isn't set, its default or the empty string is inserted. When a variable is unknown (that is, its name isn't defined) the name of the variable is inserted and it is transformed into a placeholder. ${source}`
					);

					const placeholderTransform = new CompletionItem('placeholderTransform', Event);
					placeholderTransform.insertText = new SnippetString(
						`\\\${${id}/(.*)/\\\${${id}:/\${2|capitalize,upcase,downcase,pascalcase,camelcase|}}/}$0`
					);
					placeholderTransform.detail = 'placeholderTransform snippet insertion feature';
					placeholderTransform.documentation = new MarkdownString(
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

	if (getConfiguration('snippetstudio').get<boolean>('editor.autoFillSnippetFeatureIds')) {
		return max + 1;
	}

	return `\${1:${max + 1}}`;
}

function variableList(): string {
	return 'TM_SELECTED_TEXT,TM_CURRENT_LINE,TM_CURRENT_WORD,TM_LINE_INDEX,TM_LINE_NUMBER,TM_FILENAME,TM_FILENAME_BASE,TM_DIRECTORY,TM_FILEPATH,RELATIVE_FILEPATH,CLIPBOARD,WORKSPACE_NAME,WORKSPACE_FOLDER,CURSOR_INDEX,CURSOR_NUMBER,CURRENT_YEAR,CURRENT_YEAR_SHORT,CURRENT_MONTH,CURRENT_MONTH_NAME,CURRENT_MONTH_NAME_SHORT,CURRENT_DATE,CURRENT_DAY_NAME,CURRENT_DAY_NAME_SHORT,CURRENT_HOUR,CURRENT_MINUTE,CURRENT_SECOND,CURRENT_SECONDS_UNIX,CURRENT_TIMEZONE_OFFSET,RANDOM,RANDOM_HEX,UUID,BLOCK_COMMENT_START,BLOCK_COMMENT_END,LINE_COMMENT';
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

	const selectedVariable = await showQuickPick(variables, {
		placeHolder: 'Select a snippet variable',
	});

	return selectedVariable?.label;
}
