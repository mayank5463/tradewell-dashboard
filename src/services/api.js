const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";

if (
  !process.env.REACT_APP_BACKEND_URL &&
  process.env.NODE_ENV === "production"
) {
  // Same class of bug that broke the marketing site's login earlier —
  // fails loudly in the console instead of silently hitting localhost.
  console.error(
    "[CONFIG] REACT_APP_BACKEND_URL is not set. Set it in Vercel's environment variables and redeploy.",
  );
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",

      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
    credentials: "include", // send auth cookie/session
    ...options,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      body?.message || body?.error || `Request failed: HTTP ${res.status}`,
    );
  }
  return body;
}

export { BASE_URL, apiFetch };
