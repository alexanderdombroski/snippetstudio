import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
	showBodyHandler,
	addGlobalHandler,
	createAtHandler,
	fromSelectionHandler,
	editHandler,
	deleteSnippetHandler,
	moveHandler,
	addKeybindingHandler,
	newTemplateHandler,
	usingPatternHandler,
} from './handlers';
import type { SnippetFileTreeItem, SnippetTreeItem } from '../../ui/templates';
import { promptAddKeybinding } from '../../snippets/keyBindings';
import { deleteSnippet, moveSnippet } from '../../snippets/updateSnippets';
import { refreshAll } from '../utils';
import { peekAtSnippet } from '../../ui/peeker/peek';
import {
	createFileTemplate,
	createGlobalSnippet,
	createSnippetAt,
	createSnippetFromSelection,
	createSnippetUsingFileExtension,
	editExistingSnippet,
} from '../../ui/editor/actions';
import type { Uri } from 'vscode';

vi.mock('../utils');
vi.mock('../../ui/peeker/peek');
vi.mock('../../ui/editor/actions');
vi.mock('../../snippets/updateSnippets');
vi.mock('../../snippets/keyBindings');

beforeAll(() => {
	vi.clearAllMocks();
});

const item: SnippetTreeItem = {
	label: 'test',
	collapsibleState: 1,
	path: '/path/to/snippet.json',
	description: 'mySnippet',
	contextValue: 'snippet',
};

describe('handlers', () => {
	describe('showBodyHandler', () => {
		it('should run the command', async () => {
			await showBodyHandler(item);
			expect(peekAtSnippet).toBeCalledWith('/path/to/snippet.json', 'mySnippet');
		});
	});

	describe('addGlobalHandler', () => {
		it('should run the command', async () => {
			await addGlobalHandler();
			expect(createGlobalSnippet).toBeCalled();
		});
	});

	describe('createAtHandler', () => {
		it('should run the command', async () => {
			await createAtHandler({ filepath: 'example.code-snippets' } as SnippetFileTreeItem);
			expect(createSnippetAt).toBeCalled();
		});
	});

	describe('fromSelectionHandler', () => {
		it('should run the command', async () => {
			await fromSelectionHandler();
			expect(createSnippetFromSelection).toBeCalled();
		});
	});

	describe('editHandler', () => {
		it('should run the command', async () => {
			await editHandler(item);
			expect(editExistingSnippet).toBeCalled();
		});
	});

	describe('deleteSnippetHandler', () => {
		it('should run the command', async () => {
			await deleteSnippetHandler(item);
			expect(deleteSnippet).toBeCalled();
			expect(refreshAll).toBeCalled();
		});
	});

	describe('moveHandler', () => {
		it('should run the command', async () => {
			await moveHandler(item);
			expect(moveSnippet).toBeCalledWith(item);
			expect(refreshAll).toBeCalled();
		});
	});

	describe('newTemplateHandler', () => {
		it('should run the command', async () => {
			await newTemplateHandler({} as Uri);
			expect(createFileTemplate).toBeCalled();
		});
	});

	describe('usingPatternHandler', () => {
		it('should run the command', async () => {
			await usingPatternHandler({} as Uri);
			expect(createSnippetUsingFileExtension).toBeCalled();
		});
	});

	describe('addKeybindingHandler', () => {
		it('should run the command', async () => {
			await addKeybindingHandler(item);
			expect(promptAddKeybinding).toBeCalledWith(item);
		});
	});
});
