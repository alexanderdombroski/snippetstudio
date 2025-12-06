import { describe, it, expect, vi, beforeAll } from 'vitest';
import {
	createHandler,
	editHandler,
	deleteHandler,
	runHandler,
	refreshHandler,
	manageProfilesHandler,
} from './handlers';
import {
	createShellSnippet,
	editShellSnippet,
	deleteShellSnippet,
	runShellSnippet,
	manageProfiles,
} from '../../ui/shell/actions';
import { getShellView } from '../../ui/shell/ShellViewProvider';
import type { ShellTreeDropdown, ShellTreeItem } from '../../ui/shell/ShellViewProvider';

const mockRefresh = vi.fn();

vi.mock('../../ui/shell/actions');
vi.mock('../../ui/shell/ShellViewProvider', () => ({
	getShellView: vi.fn(() => ({
		refresh: mockRefresh,
	})),
}));

beforeAll(() => {
	vi.clearAllMocks();
});

const item: ShellTreeItem = {
	label: 'test',
	collapsibleState: 0,
	isLocal: false,
	runImmediately: false,
	profile: 'default',
};

describe('handlers', () => {
	describe('createHandler', () => {
		it('should create a shell snippet with item', async () => {
			const item: ShellTreeDropdown = {
				label: 'test',
				collapsibleState: 1,
				hasItems: true,
				icon: 'folder',
				isLocal: false,
			};

			await createHandler(item);
			expect(createShellSnippet).toBeCalledWith(item);
		});

		it('should create a shell snippet without item', async () => {
			await createHandler();
			expect(createShellSnippet).toBeCalledWith(undefined);
		});
	});

	describe('editHandler', () => {
		it('should edit a shell snippet', async () => {
			await editHandler(item);
			expect(editShellSnippet).toBeCalledWith(item);
		});
	});

	describe('deleteHandler', () => {
		it('should delete a shell snippet', async () => {
			await deleteHandler(item);
			expect(deleteShellSnippet).toBeCalledWith(item);
		});
	});

	describe('runHandler', () => {
		it('should run a shell snippet', async () => {
			await runHandler(item);
			expect(runShellSnippet).toBeCalledWith(item);
		});
	});

	describe('refreshHandler', () => {
		it('should refresh the shell view', async () => {
			await refreshHandler();
			expect(getShellView).toBeCalled();
			expect(mockRefresh).toBeCalled();
		});
	});

	describe('manageProfilesHandler', () => {
		it('should manage profiles', async () => {
			await manageProfilesHandler();
			expect(manageProfiles).toBeCalled();
		});
	});
});
