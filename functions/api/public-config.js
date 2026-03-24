const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store, no-cache, must-revalidate",
  "x-content-type-options": "nosniff",
};

function readEnvString(env, key) {
  return String(env?.[key] || "").trim();
}

export async function onRequestGet(context) {
  const { env } = context;
  const payload = {
    firebaseConfig: {
      apiKey: readEnvString(env, "FIREBASE_API_KEY"),
      authDomain: readEnvString(env, "FIREBASE_AUTH_DOMAIN"),
      projectId: readEnvString(env, "FIREBASE_PROJECT_ID"),
      storageBucket: readEnvString(env, "FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readEnvString(env, "FIREBASE_MESSAGING_SENDER_ID"),
      appId: readEnvString(env, "FIREBASE_APP_ID"),
      measurementId: readEnvString(env, "FIREBASE_MEASUREMENT_ID"),
    },
    storeWhatsAppNumber: readEnvString(env, "STORE_WHATSAPP_NUMBER"),
  };

  const missing = [
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
    "STORE_WHATSAPP_NUMBER",
  ].filter(key => !readEnvString(env, key));

  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error: "Missing public runtime configuration",
        missing,
      }),
      {
        status: 500,
        headers: JSON_HEADERS,
      },
    );
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: JSON_HEADERS,
  });
}
