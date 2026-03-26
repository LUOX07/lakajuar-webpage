const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, no-cache, must-revalidate",
  "x-content-type-options": "nosniff",
};

function readEnvString(env, key) {
  return String(env?.[key] || "").trim();
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const configuredEmail = readEnvString(env, "ADMIN_EMAIL").toLowerCase();
  const configuredCode = readEnvString(env, "ADMIN_ACCESS_CODE");

  if (!configuredEmail || !configuredCode) {
    return jsonResponse({ error: "admin-config-missing" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid-request-body" }, 400);
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const code = String(body?.code || "").trim();

  if (!email) {
    return jsonResponse({ error: "admin-email-not-allowed" }, 403);
  }

  if (!code) {
    return jsonResponse({ error: "admin-code-required" }, 400);
  }

  if (email !== configuredEmail) {
    return jsonResponse({ error: "admin-email-not-allowed" }, 403);
  }

  if (code !== configuredCode) {
    return jsonResponse({ error: "admin-code-invalid" }, 403);
  }

  return jsonResponse({ ok: true });
}