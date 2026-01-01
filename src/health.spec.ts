import test, { expect } from "@playwright/test";

test("health check API", async ({ request }) => {
	const response = await request.get("/");

	expect(response.status()).toBe(200);
});
