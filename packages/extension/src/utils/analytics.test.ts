import { beforeEach, describe, expect, it, vi } from 'vitest';
import { captureEvent } from './analytics';

const fetch = vi.fn();
vi.stubGlobal('fetch', fetch);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('analytics', () => {
	describe('captureEvent', () => {
		it("shouldn't track events from dev environments", async () => {
			vi.stubEnv('IS_PRODUCTION_BUILD', '');
			await captureEvent('test', {});
			expect(fetch).not.toBeCalled();
		});

		it('should track events in prod', async () => {
			vi.stubEnv('IS_PRODUCTION_BUILD', 'true');
			await captureEvent('test', {});
			expect(fetch).toBeCalled();
		});
	});
});
