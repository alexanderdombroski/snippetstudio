/** 'snippetstudio.sync.setup' command handler */
export async function syncSetupHandler() {
	const { setup } = await import('../../snippets/sync/setup.js');
	void setup();
}
