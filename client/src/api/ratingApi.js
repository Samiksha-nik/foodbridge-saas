const getBaseUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function getJsonHeaders() {
  return { "Content-Type": "application/json" };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      (res.status === 401 ? "Authentication required" : "Request failed");
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * POST /api/ratings
 * Body: { donationId, ngoId, providerId, rating, feedback? }
 */
export async function createRating(body) {
  const res = await fetch(`${getBaseUrl()}/api/ratings`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

/**
 * GET /api/ratings/ngo/:ngoId
 * Returns { data: Array } with items having id, stars, feedback, from_name, created_date
 */
export async function getNgoRatings(ngoId) {
  const res = await fetch(`${getBaseUrl()}/api/ratings/ngo/${encodeURIComponent(ngoId)}`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

/**
 * GET /api/ratings/provider
 * Returns ratings received by the logged-in provider.
 */
export async function getProviderRatings() {
  const res = await fetch(`${getBaseUrl()}/api/ratings/provider`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

