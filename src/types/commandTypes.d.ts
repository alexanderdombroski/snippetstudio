interface CommandMap {
	[command: string]: (...args: any[]) => void;
}

type DiagnosticsLevel = 'all' | 'suppressed' | 'none';

export type { CommandMap, DiagnosticsLevel };
