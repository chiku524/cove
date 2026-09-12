export function json<T>(body: T, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, x-api-key",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      ...init?.headers,
    },
  });
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, x-api-key",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}

export function notFound(entity = "Resource") {
  return json({ error: "not_found", message: `${entity} was not found.` }, { status: 404 });
}

export function badRequest(message: string) {
  return json({ error: "bad_request", message }, { status: 400 });
}

export function unauthorized(message = "Sign in to continue.") {
  return json({ error: "unauthorized", message }, { status: 401 });
}

export function planLimit(code: string, message: string) {
  return json({ error: "plan_limit", code, message }, { status: 402 });
}
