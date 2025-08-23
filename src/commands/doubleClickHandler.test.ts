import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import onDoubleClick from './doubleClickHandler';
import { TreePathItem } from '../ui/templates';

const item: TreePathItem = new TreePathItem('hello', 0, 'world');

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
		const item1: TreePathItem = new TreePathItem('hi', 0, 'world');
		const item2: TreePathItem = new TreePathItem('howdy', 0, 'world');

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
