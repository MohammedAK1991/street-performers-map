import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@spm/shared-types": path.resolve(
				__dirname,
				"../../packages/shared-types/src",
			),
		},
	},
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: "http://localhost:3002",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor chunks
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'auth-vendor': ['@clerk/clerk-react'],
					'query-vendor': ['@tanstack/react-query'],
					'maps-vendor': ['@vis.gl/react-google-maps'],
					'ui-vendor': ['react-hot-toast'],
					
					// Feature chunks
					'onboarding': ['./src/components/onboarding/OnboardingWizard'],
					'analytics': ['./src/pages/Analytics'],
					'performance': ['./src/pages/CreatePerformance', './src/components/PerformanceModal'],
					'payment': ['./src/components/TipModal'],
				},
			},
		},
		chunkSizeWarningLimit: 1000, // Increase limit to 1MB
	},
});
