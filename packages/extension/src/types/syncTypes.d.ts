export type AppName =
	| 'Antigravity'
	| 'Antigravity IDE'
	| 'Visual Studio Code'
	| 'Visual Studio Code - Insiders'
	| 'VSCodium'
	| 'Cursor'
	| 'Windsurf'
	| 'Devin'
	| 'Kiro'
	| 'Trae'
	| 'AbacusAI'
	| 'code-server';

export type MachineConfig = {
	'sync.startingEditor'?: AppName;
	'sync.editors'?: AppName[];
};
