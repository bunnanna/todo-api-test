import test, { expect } from "@playwright/test";
import { CookieJar } from "tough-cookie";

const jar = new CookieJar();
let cookieHeader: string;

test.describe.serial("user", () => {
	const username = `test${Date.now()}`;
	const password = "testtesttest";
	test("should create user", async ({ request }) => {
		const createUser = {
			username,
			password,
		};
		const res = await request.post("/user/sign-up", {
			data: createUser,
		});
		expect(res.status()).toBe(200);
		expect(await res.json()).toHaveProperty("username", username);
	});

	test("login and store cookies", async ({ request, baseURL }) => {
		const res = await request.post("/auth/login", {
			data: {
				username,
				password,
			},
		});

		expect(res.ok()).toBeTruthy();

		const setCookies = res.headers()["set-cookie"];
		expect(setCookies).toBeTruthy();

		const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];

		for (const c of cookies) {
			await jar.setCookie(c, baseURL!);
		}

		cookieHeader = await jar.getCookieString(baseURL!);
	});

	test("get self data", async ({ request }) => {
		const res = await request.get("/user/", {
			headers: { Cookie: cookieHeader },
		});

		expect(res.ok()).toBeTruthy();
		expect(await res.json()).toHaveProperty("username", username);
	});

	test("should not create same username", async ({ request }) => {
		const createUser = {
			username,
			password,
		};
		const res = await request.post("/user/sign-up", {
			data: createUser,
		});
		expect(res.ok()).toBeFalsy();
	});
});
