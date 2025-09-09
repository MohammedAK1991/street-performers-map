module.exports = {
	root: true,
	env: { 
		browser: true, 
		es2020: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	plugins: ["@typescript-eslint"],
	globals: {
		React: "readonly",
		google: "readonly",
		NodeJS: "readonly",
		PermissionName: "readonly",
		__dirname: "readonly",
	},
	rules: {
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		"no-unused-vars": "off", // Turn off base rule as it can report incorrect errors
		"no-useless-escape": "warn",
		"no-empty": "warn",
	},
};