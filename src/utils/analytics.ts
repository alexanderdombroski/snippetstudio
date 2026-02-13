import type { JSONObject } from '../types';
import vscode from '../vscode';
import { createHash } from 'node:crypto';

/**
 * @description "You can use this write-only key in any one of our libraries.
 * Write-only means it can only create new events. It can't read events or any of
 * your other data stored with PostHog, so it's safe to use in public apps."
 */
const PUBLIC_API_KEY = 'phc_jBUZ0hcAzXE76peuy4ma8oE8YvbPH3ddfNeMTT55IMP';
const API_BASE = 'https://us.i.posthog.com';

type CaptureBody = {
	api_key: string;
	event: string;
	properties: JSONObject & {
		distinct_id: string;
	};
	timestamp: string;
};

/** Send an event with posthog */
export function captureEvent(event: string, data: JSONObject) {
	if (!process.env.IS_PRODUCTION_BUILD) return;
	const payload: CaptureBody = {
		api_key: PUBLIC_API_KEY,
		event,
		properties: {
			distinct_id: createHash('sha256').update(vscode.env.machineId).digest('hex'),
			...data,
		},
		timestamp: new Date().toISOString(),
	};

	fetch(`${API_BASE}/capture`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}
