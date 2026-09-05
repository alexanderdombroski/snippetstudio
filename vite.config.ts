import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		target: 'node24',
		copyPublicDir: false,
		rolldownOptions: {
			external: [...builtinModules, ...builtinModules.map((name) => `node:${name}`)],
		},
	},
});
