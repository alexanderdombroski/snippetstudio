import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { MachineConfig } from '../types';
import { readJson, writeJson } from './jsoncFilesIO';
import { exists } from './fsInfo';

export function getLocalDataDir() {
	let dataDir = '';
	switch (process.platform) {
		case 'win32':
			dataDir = path.join('AppData', 'Roaming');
			break;
		case 'darwin':
			dataDir = path.join('Library', 'Application Support');
			break;
		case 'linux':
			dataDir = path.join('.local', 'share');
			break;
		default:
			throw new Error(`Unsupported platform: ${process.platform}`);
	}

	return path.join(os.homedir(), dataDir, 'snippetstudio');
}

function getConfigPath() {
	return path.join(getLocalDataDir(), 'config.json');
}

async function createConfigIfNeeded() {
	if (!(await exists(getConfigPath()))) {
		await fs.mkdir(getLocalDataDir(), { recursive: true });
		await writeJson(getConfigPath(), {});
	}
}

export async function writeDeviceSettings(newConfig: MachineConfig) {
	await createConfigIfNeeded();
	await writeJson(getConfigPath(), newConfig);
}

export async function getDeviceSettings(): Promise<MachineConfig | undefined> {
	await createConfigIfNeeded();
	const config = (await readJson(getConfigPath())) as MachineConfig;
	return config;
}
