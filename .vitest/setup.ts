import { loadEnvFile } from 'node:process';
import path from 'node:path';

try {
	loadEnvFile(path.resolve(import.meta.dirname, '.env'));
} catch {}
