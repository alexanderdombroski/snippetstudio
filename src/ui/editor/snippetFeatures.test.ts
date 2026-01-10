import { describe, it, expect, vi, beforeEach, type Mock, type Mocked } from 'vitest';
import initSnippetFeatureCommands, {
	_getNextFeatureNumber,
	_showVariableQuickPick,
	_variableList,
} from './snippetFeatures';
import vscode, {
	getConfiguration,
	onDidChangeTextDocument,
	registerTextEditorCommand,
	MarkdownString,
	SnippetString,
	CompletionItem,
	showQuickPick,
} from '../../vscode';
import { context } from '../../../.vitest/__mocks__/shared';
import type SnippetEditorProvider from './SnippetEditorProvider';
import type {
	CancellationToken,
	CompletionContext,
	Position,
	TextDocument,
	TextEditor,
	CompletionItem as CompletionItemType,
	CompletionItemProvider,
} from 'vscode';

const mockProvider = {
	handleDocumentChange: vi.fn(),
} as Pick<SnippetEditorProvider, 'handleDocumentChange'> as Mocked<SnippetEditorProvider>;

(getConfiguration as Mock).mockReturnValue({
	get: vi.fn().mockReturnValue(false), // default to not using quick pick
});

describe('initSnippetFeatureCommands', () => {
	it('should register document change listener and completion provider', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetFeatureCommands(context, mockProvider);

		expect(onDidChangeTextDocument).toHaveBeenCalledWith(
			mockProvider.handleDocumentChange,
			mockProvider
		);
		expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
			{ scheme: 'snippetstudio' },
			expect.any(Object)
		);
	});

	it('should register all feature commands', () => {
		vi.spyOn(context.subscriptions, 'push');
		initSnippetFeatureCommands(context, mockProvider);

		expect(registerTextEditorCommand).toHaveBeenCalledTimes(6);
		expect(context.subscriptions.push).toHaveBeenCalledTimes(5); // 3 commands sets + 1 listener + 1 provider

		const registeredCommands = (registerTextEditorCommand as Mock).mock.calls.map(
			(call: any[]) => call[0]
		);

		expect(registeredCommands).toEqual(
			expect.arrayContaining([
				'snippetstudio.editor.insertTabStop',
				'snippetstudio.editor.insertPlaceholder',
				'snippetstudio.editor.insertChoice',
				'snippetstudio.editor.insertVariable',
				'snippetstudio.editor.insertVariablePlaceholder',
				'snippetstudio.editor.insertPlaceholderWithTranformation',
			])
		);
	});

	describe('Variable Insertion Commands', () => {
		it('should register variable commands with choices when quick pick is disabled', () => {
			vi.spyOn(context.subscriptions, 'push');
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(false) });
			initSnippetFeatureCommands(context, mockProvider);

			const registeredCommands = (registerTextEditorCommand as Mock).mock.calls
				.map((call: any[]) => call[0])
				.filter(
					(cmd) =>
						cmd === 'snippetstudio.editor.insertVariable' ||
						cmd === 'snippetstudio.editor.insertVariablePlaceholder'
				);

			expect(registeredCommands).toHaveLength(2);
		});

		it('should register variable commands with quick pick when enabled', () => {
			vi.spyOn(context.subscriptions, 'push');
			(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(true) });
			initSnippetFeatureCommands(context, mockProvider);

			const registeredCommands = (registerTextEditorCommand as Mock).mock.calls
				.map((call: any[]) => call[0])
				.filter(
					(cmd) =>
						cmd === 'snippetstudio.editor.insertVariable' ||
						cmd === 'snippetstudio.editor.insertVariablePlaceholder'
				);

			expect(registeredCommands).toHaveLength(2);
		});
	});
});

describe('getNextFeatureNumber', () => {
	let mockEditor: TextEditor;

	beforeEach(() => {
		mockEditor = {
			document: {
				getText: vi.fn(),
			},
		} as unknown as TextEditor;
	});

	it('should start at 1 for an empty document', () => {
		(mockEditor.document.getText as Mock).mockReturnValue('');
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(true) });
		expect(_getNextFeatureNumber(mockEditor)).toBe(1);
	});

	it('should find the next available number', () => {
		(mockEditor.document.getText as Mock).mockReturnValue('const a = ${1:foo}; const b = $2;');
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(true) });
		expect(_getNextFeatureNumber(mockEditor)).toBe(3);
	});

	it('should ignore escaped dollar signs', () => {
		(mockEditor.document.getText as Mock).mockReturnValue('const a = \\${1:foo};');
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(true) });
		expect(_getNextFeatureNumber(mockEditor)).toBe(1);
	});

	it('should return a snippet placeholder if autoFill is off', () => {
		(mockEditor.document.getText as Mock).mockReturnValue('');
		(getConfiguration as Mock).mockReturnValue({ get: vi.fn().mockReturnValue(false) });
		expect(_getNextFeatureNumber(mockEditor)).toBe('${1:1}');
	});
});

describe('variableList', () => {
	it('should return a comma-separated string of variables', () => {
		const list = _variableList();
		expect(typeof list).toBe('string');
		expect(list).toContain('TM_SELECTED_TEXT');
		expect(list).toContain('LINE_COMMENT');
		expect(list.split(',')).toHaveLength(34);
	});
});

describe('showVariableQuickPick', () => {
	it('should show quick pick and return selected label', async () => {
		(showQuickPick as Mock).mockResolvedValue({ label: 'TM_CURRENT_LINE' });
		const result = await _showVariableQuickPick();
		expect(showQuickPick).toHaveBeenCalled();
		expect(result).toBe('TM_CURRENT_LINE');
	});

	it('should return undefined if nothing is selected', async () => {
		(showQuickPick as Mock).mockResolvedValue(undefined);
		const result = await _showVariableQuickPick();
		expect(result).toBeUndefined();
	});
});

describe('CompletionItemProvider', () => {
	let provider: CompletionItemProvider;

	beforeEach(() => {
		initSnippetFeatureCommands(context, mockProvider);
		provider = (vscode.languages.registerCompletionItemProvider as Mock).mock.calls[0][1];
	});

	it('should register with the correct scheme', () => {
		expect(vscode.languages.registerCompletionItemProvider).toBeCalledWith(
			{ scheme: 'snippetstudio' },
			expect.objectContaining({
				provideCompletionItems: expect.any(Function),
			})
		);
	});

	it('should register six completion items', () => {
		const items = provider.provideCompletionItems(
			{} as TextDocument,
			{} as Position,
			{} as CancellationToken,
			{} as CompletionContext
		) as CompletionItemType[];

		expect(CompletionItem).toBeCalledTimes(6);
		expect(MarkdownString).toBeCalledTimes(6);
		expect(SnippetString).toBeCalledTimes(6);

		expect(items.map((i) => i.label)).toEqual([
			'tabstop',
			'placeholder',
			'choice',
			'variable',
			'variablePlaceholder',
			'placeholderTransform',
		]);
	});
});
