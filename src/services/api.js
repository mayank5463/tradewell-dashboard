
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3002";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include", // send auth cookie/session
    ...options,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Backend isn't consistent about the error key: historicalController.js
    // uses `message`, orderController.js uses `error`. Check both so real
    // server error text (e.g. "You only have 3 shares of RELIANCE.") always
    // reaches the UI instead of falling back to a generic HTTP message.
    throw new Error(body?.message || body?.error || `Request failed: HTTP ${res.status}`);
  }
  return body;
}

export { BASE_URL, apiFetch };