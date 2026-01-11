import test, { expect } from "@playwright/test";

test.describe.serial("with auth", () => {
	test.use({ storageState: "./store/auth.json" });
	let id: number;
	const reqBody = {
		title: "title",
		description: "description",
	};

	test("create todo", async ({ request }) => {
		const res = await request.post("/todo/", {
			data: reqBody,
		});
		expect(res.status()).toBe(200);
		const resBody = await res.json();
		expect(resBody).toHaveProperty("title", reqBody["title"]);
		id = resBody["id"];
	});

	test("get todo", async ({ request }) => {
		const res = await request.get(`/todo/${id}`);
		expect(res.status()).toBe(200);
		const resBody = await res.json();
		expect(resBody).toHaveProperty("title", reqBody["title"]);
	});
});
