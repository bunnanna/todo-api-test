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
		expect(resBody).toHaveProperty("description", reqBody["description"]);
		id = resBody["id"];
	});

	test("get todo", async ({ request }) => {
		const res = await request.get(`/todo/${id}`);
		expect(res.status()).toBe(200);
		const resBody = await res.json();
		expect(resBody).toHaveProperty("title", reqBody["title"]);
		expect(resBody).toHaveProperty("description", reqBody["description"]);
	});

	test("list todos", async ({ request }) => {
		const res = await request.get("/todo/");
		expect(res.status()).toBe(200);
		const resBody = await res.json();
		expect(Array.isArray(resBody)).toBeTruthy();
		const found = resBody.find((t: { id: number }) => t.id === id);
		expect(found).toBeDefined();
	});

	test("update todo", async ({ request }) => {
		const updated = { title: "updated title", description: "updated description" };
		const res = await request.put(`/todo/${id}`, {
			data: updated,
		});
		expect(res.status()).toBe(200);
		const resBody = await res.json();
		expect(resBody).toHaveProperty("title", updated.title);
		expect(resBody).toHaveProperty("description", updated.description);
	});

	test("delete todo", async ({ request }) => {
		const res = await request.delete(`/todo/${id}`);
		expect(res.status()).toBe(200);
	});

	test("get deleted todo returns 404", async ({ request }) => {
		const res = await request.get(`/todo/${id}`);
		expect(res.status()).toBe(404);
	});
});

test.describe("without auth", () => {
	test("create todo returns 401", async ({ request }) => {
		const res = await request.post("/todo/", {
			data: { title: "title", description: "description" },
		});
		expect(res.status()).toBe(401);
	});

	test("get todo returns 401", async ({ request }) => {
		const res = await request.get("/todo/1");
		expect(res.status()).toBe(401);
	});

	test("list todos returns 401", async ({ request }) => {
		const res = await request.get("/todo/");
		expect(res.status()).toBe(401);
	});
});
