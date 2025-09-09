module.exports = {
	root: true,
	env: {
		node: true,
		es2022: true,
	},
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2022,
		sourceType: "module",
		project: "./tsconfig.json",
	},
	plugins: ["@typescript-eslint"],
	rules: {
		// Customize rules as needed
		"@typescript-eslint/no-unused-vars": [
			"error",
			{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
		],
		"@typescript-eslint/no-explicit-any": "warn",
		"prefer-const": "error",
		"no-console": "warn",
		"@typescript-eslint/no-namespace": "off",
	},
	ignorePatterns: [
		"dist",
		"build",
		"node_modules",
		"*.js",
		"vite.config.ts",
		"vitest.config.ts",
	],
};
