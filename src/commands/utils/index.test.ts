import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onDoubleClick, refreshAll } from '.';
import { TreeItem } from '../../vscode';
import { executeCommand } from '../../vscode';

const item = new TreeItem('hello', 0);

describe('onDoubleClick', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should call the callback on a double-click', () => {
		const callback = vi.fn();
		const doubleClickHandler = onDoubleClick(callback);

		doubleClickHandler(item);
		vi.advanceTimersByTime(100);
		doubleClickHandler(item);

		expect(callback).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(item);
	});

	it('should not call the callback on a single click', () => {
		const callback = vi.fn();
		const doubleClickHandler = onDoubleClick(callback);

		doubleClickHandler(item);
		vi.advanceTimersByTime(500);

		expect(callback).not.toHaveBeenCalled();
	});

	it('should not call the callback on two slow clicks', () => {
		const callback = vi.fn();
		const doubleClickHandler = onDoubleClick(callback);

		doubleClickHandler(item);
		vi.advanceTimersByTime(400);
		doubleClickHandler(item);

		expect(callback).not.toHaveBeenCalled();
	});

	it('should handle different items independently', () => {
		const callback = vi.fn();
		const doubleClickHandler = onDoubleClick(callback);
		const item1 = new TreeItem('hi', 0);
		const item2 = new TreeItem('howdy', 0);

		doubleClickHandler(item1);
		vi.advanceTimersByTime(100);
		doubleClickHandler(item2);
		vi.advanceTimersByTime(100);
		doubleClickHandler(item1);

		expect(callback).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(item1);
	});

	it('should reset the timer after a successful double-click', () => {
		const callback = vi.fn();
		const doubleClickHandler = onDoubleClick(callback);

		// First double-click
		doubleClickHandler(item);
		vi.advanceTimersByTime(100);
		doubleClickHandler(item);

		expect(callback).toHaveBeenCalledTimes(1);

		// Wait a bit
		vi.advanceTimersByTime(500);

		// Try another double-click
		doubleClickHandler(item);
		vi.advanceTimersByTime(100);
		doubleClickHandler(item);

		expect(callback).toHaveBeenCalledTimes(2);
	});
});

describe('refreshAll', () => {
	it('should refresh both snippet views', async () => {
		refreshAll();
		expect(executeCommand).toBeCalledWith('snippetstudio.refresh');
		expect(executeCommand).toBeCalledWith('snippetstudio.refreshLocations');
	});
});
