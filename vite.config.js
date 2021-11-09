import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			name: 'MCProjectCore',
			fileName: (format) => `mc-project-core.${format}.js`,
		},
		rollupOptions: {
			external: ['micromatch', 'json5', 'path-browserify'],
		},
	},
})
