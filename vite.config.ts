import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'baseLocale']
		})
	],
	resolve: {
		alias: {
			$img: path.resolve('./src/img')
		}
	},
	// Suppress source map warnings from Paraglide (it doesn't generate them)
	server: {
		sourcemapIgnoreList: (sourcePath) => sourcePath.includes('paraglide')
	},
	build: {
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.message?.includes('paraglide') && warning.message?.includes('sourcemap')) {
					return;
				}
				warn(warning);
			}
		}
	}
});
