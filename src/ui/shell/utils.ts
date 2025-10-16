import { execSync } from 'node:child_process';
import type { Terminal } from 'vscode';
import vscode from '../../vscode';

/** Tells whether a shell PID has a command running */
function hasActiveChild(pid: number): boolean {
	try {
		const cmd =
			process.platform === 'win32'
				? `powershell -Command "(Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${pid} }).ProcessId"`
				: `pgrep -P ${pid}`;

		const output = execSync(cmd).toString().trim();
		return output.length > 0;
	} catch {
		return false; // no children
	}
}

/** Finds a snippetstudio terminal that is availabe for use */
export async function findInactiveTerminal(): Promise<Terminal | undefined> {
	const terminals = vscode.window.terminals.filter((t) => t.name === 'snippetstudio');
	for (const terminal of terminals) {
		const pid = await terminal.processId;
		if (pid === undefined || !hasActiveChild(pid)) {
			return terminal;
		}
	}
}
