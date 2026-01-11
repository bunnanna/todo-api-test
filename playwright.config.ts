import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./src",
	globalSetup: ["./src/setup/auth.setup.ts"],

	use: {
		baseURL: "http://localhost:8080",
		extraHTTPHeaders: {
			Accept: "application/json",
		},
	},

	// Disable browser usage
	projects: [
		{
			name: "api",
			use: {},
		},
	],

	// reporter: [["list"], ["html"]],
});
