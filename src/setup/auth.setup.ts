import { expect, request, type FullConfig } from "@playwright/test";

export default async (config: FullConfig) => {
	const { use } = config.projects[0];
	const ctx = await request.newContext(use);
	const username = `test${Date.now()}`;
	const password = "testtesttest";

	const res = await ctx.post("/user/sign-up", {
		data: {
			username,
			password,
		},
	});
	expect(res.status()).toBe(200);

	await ctx.post("/auth/login", {
		data: {
			username,
			password,
		},
	});

	await ctx.storageState({ path: "./store/auth.json" });
	await ctx.dispose();
};
