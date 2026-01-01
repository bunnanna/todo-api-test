import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./src",

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
