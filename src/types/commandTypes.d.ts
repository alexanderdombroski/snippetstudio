interface CommandMap {
	[command: string]: () => void;
}

type DiagnosticsLevel = 'all' | 'suppressed' | 'none';

export type { CommandMap, DiagnosticsLevel };
