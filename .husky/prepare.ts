#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

if (process.env['npm_command'] === 'ci') {
	console.info('CI detected, skipping Husky prepare.');
	process.exit(0);
}

try {
	console.info('> Ensuring Husky hooks are setup');
	const { stdout, stderr } = await execAsync('npx husky');
	if (stdout) console.info(stdout);
	if (stderr) console.error(stderr);
} catch (err) {
	console.error('❌ Failed to install Husky:', err);
	process.exit(1);
}
