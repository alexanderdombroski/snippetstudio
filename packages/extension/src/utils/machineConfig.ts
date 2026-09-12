import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { exists } from './fsInfo';
import type { GenericJson } from '../types';
import { showErrorMessage } from '../vscode';

export interface MachineConfig {
	[key: string]: GenericJson | undefined;
}

export const CONFIG_DIR = path.join(os.homedir(), '.config', 'snippetstudio');
export const CONFIG_PATH = path.join(CONFIG_DIR, 'settings.json');

/** Reads the machine settings json file */
export async function readMachineConfig<T = MachineConfig>(): Promise<T | undefined> {
	if (!(await exists(CONFIG_PATH))) {
		return undefined;
	}

	try {
		const content = await fs.readFile(CONFIG_PATH, 'utf-8');
		return JSON.parse(content) as T;
	} catch (error) {
		showErrorMessage(`Error reading machine config at ${CONFIG_PATH}: ${error as Error}`);
		return undefined;
	}
}

/** Writes to the machine settings json file */
export async function writeMachineConfig<T extends Record<string, any> = MachineConfig>(
	config: T
): Promise<void> {
	await fs.mkdir(CONFIG_DIR, { recursive: true });
	const jsonString = JSON.stringify(config, null, 2);
	await fs.writeFile(CONFIG_PATH, jsonString, 'utf-8');
}

/**
 * Reads settings, updates a key, and rewrites the config object.
 * Returns the updated configuration.
 */
export async function editConfig<K extends string = string, V = GenericJson>(
	key: K,
	value: V
): Promise<MachineConfig> {
	const currentConfig = (await readMachineConfig()) ?? {};
	currentConfig[key] = value as GenericJson;
	await writeMachineConfig(currentConfig);
	return currentConfig;
}
