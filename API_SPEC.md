# Todo API Specification

Base URL: `http://localhost:8080`

---

## Authentication Model

This API uses **server-side session cookies** for authentication. There is no token or API key system.

### How it works

1. Call `POST /auth/login` with valid credentials.
2. The server responds with a `Set-Cookie` header containing a session cookie.
3. Include that cookie in every subsequent request via the `Cookie` header.
4. The server validates the session on each request and identifies the caller from it.

### Session Cookie

| Property    | Value / Behavior                                               |
|-------------|----------------------------------------------------------------|
| Header      | `Set-Cookie` on login response                                 |
| Name        | Server-assigned (e.g. `SESSION` or `JSESSIONID`)               |
| Type        | Opaque session token — the value itself carries no information |
| Transport   | Must be sent as `Cookie: <name>=<value>` on every request      |
| Scope       | Bound to the authenticated user on the server side             |
| Persistence | Server-managed; expires when the session is invalidated        |

### Sending credentials in subsequent requests

```http
Cookie: SESSION=abc123xyz
```

Playwright stores this automatically via `storageState` (saved to `./store/auth.json` by the global setup). For manual HTTP clients (curl, Insomnia, etc.) you must capture the `Set-Cookie` value from the login response and replay it.

### Protected endpoints

Any endpoint marked **Auth required** returns `401 Unauthorized` if:

- No `Cookie` header is present, or
- The session token is invalid or expired.

---

## Headers

### Request headers (all endpoints)

| Header         | Value              | Required                        |
|----------------|--------------------|---------------------------------|
| `Content-Type` | `application/json` | Yes (for endpoints with a body) |
| `Accept`       | `application/json` | Recommended                     |
| `Cookie`       | `<session-cookie>` | Yes (for protected endpoints)   |

### Response headers (login)

| Header       | Example value                                        | Notes                         |
|--------------|------------------------------------------------------|-------------------------------|
| `Set-Cookie` | `SESSION=abc123xyz; Path=/; HttpOnly; SameSite=Lax`  | Capture and replay this value |

`HttpOnly` means the cookie cannot be read by JavaScript — it must be managed at the HTTP layer.

---

## Health

### GET /

Check server availability. No authentication required.

**Response `200`**

```json
"OK"
```

---

## User

### POST /user/sign-up

Register a new user. No authentication required.

**Request body**

```json
{
  "username": "string",
  "password": "string"
}
```

| Field      | Type   | Constraints                     |
|------------|--------|---------------------------------|
| `username` | string | Must be unique across all users |
| `password` | string | Stored hashed on the server     |

**Response `200`**

```json
{
  "username": "string"
}
```

The password is never returned in any response.

**Response `409 Conflict`** — username already taken

---

### GET /user/

Get the profile of the currently authenticated user.

**Auth required** — send session cookie obtained from `POST /auth/login`.

**Request headers**

```http
Cookie: SESSION=<your-session-token>
```

**Response `200`**

```json
{
  "username": "string"
}
```

**Response `401 Unauthorized`** — missing or invalid session cookie

---

## Auth

### POST /auth/login

Authenticate with username and password. Returns a session cookie on success.

**Request body**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response `200`** — authentication successful

The response body is empty. Authentication state is established via the `Set-Cookie` header:

```http
Set-Cookie: SESSION=abc123xyz; Path=/; HttpOnly; SameSite=Lax
```

| Attribute      | Meaning                                                                   |
|----------------|---------------------------------------------------------------------------|
| `SESSION=…`    | Opaque session token; value varies per login                              |
| `Path=/`       | Cookie is sent for all paths under the base URL                           |
| `HttpOnly`     | Not accessible via JavaScript; must be forwarded at the HTTP layer        |
| `SameSite=Lax` | Cookie is sent on same-site requests and top-level cross-site navigations |

**How to capture and reuse the session (curl example)**

```bash
# Login and save cookies to a jar file
curl -c cookies.txt -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'

# Use saved cookie on a protected endpoint
curl -b cookies.txt http://localhost:8080/user/
```

**Response `401 Unauthorized`** — wrong username or password

---

## Todo

All todo endpoints require authentication. Include the session cookie on every request.

**Request headers (all todo endpoints)**

```http
Cookie: SESSION=<your-session-token>
Content-Type: application/json
```

Todos are scoped to the authenticated user — a user cannot read or modify another user's todos.

---

### POST /todo/

Create a new todo.

**Request body**

```json
{
  "title": "string",
  "description": "string"
}
```

| Field         | Type   | Notes    |
|---------------|--------|----------|
| `title`       | string | Required |
| `description` | string | Required |

**Response `200`**

```json
{
  "id": 1,
  "title": "string",
  "description": "string"
}
```

| Field         | Type    | Notes                                   |
|---------------|---------|-----------------------------------------|
| `id`          | integer | Server-assigned unique ID for this todo |
| `title`       | string  | Echoed from the request                 |
| `description` | string  | Echoed from the request                 |

**Response `401 Unauthorized`** — not authenticated

---

### GET /todo/

List all todos belonging to the authenticated user.

**Response `200`**

```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string"
  }
]
```

Returns an empty array `[]` if the user has no todos.

**Response `401 Unauthorized`** — not authenticated

---

### GET /todo/:id

Get a single todo by ID.

**Path parameter**

| Param | Type    | Notes                   |
|-------|---------|-------------------------|
| `id`  | integer | ID of the todo to fetch |

**Response `200`**

```json
{
  "id": 1,
  "title": "string",
  "description": "string"
}
```

**Response `401 Unauthorized`** — not authenticated

**Response `404 Not Found`** — todo does not exist or belongs to a different user

---

### PUT /todo/:id

Replace a todo's title and description.

**Path parameter**

| Param | Type    | Notes                    |
|-------|---------|--------------------------|
| `id`  | integer | ID of the todo to update |

**Request body**

```json
{
  "title": "string",
  "description": "string"
}
```

**Response `200`**

```json
{
  "id": 1,
  "title": "string",
  "description": "string"
}
```

**Response `401 Unauthorized`** — not authenticated

**Response `404 Not Found`** — todo does not exist or belongs to a different user

---

### DELETE /todo/:id

Delete a todo by ID.

**Path parameter**

| Param | Type    | Notes                    |
|-------|---------|--------------------------|
| `id`  | integer | ID of the todo to delete |

**Response `200`** — deleted successfully (empty body)

**Response `401 Unauthorized`** — not authenticated

**Response `404 Not Found`** — todo does not exist or belongs to a different user

---

## Error reference

| Status | Meaning                                                    |
|--------|------------------------------------------------------------|
| `200`  | Success                                                    |
| `401`  | Authentication required — send a valid session cookie      |
| `404`  | Resource not found, or found but owned by a different user |
| `409`  | Conflict — e.g. username already registered                |
