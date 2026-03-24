const getBaseUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function getJsonHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.message ||
      (res.status === 401
        ? "Authentication required"
        : res.status === 403
        ? "Access denied"
        : "Request failed");
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function recommendNgos(donationId) {
  const res = await fetch(`${getBaseUrl()}/api/ai/recommend-ngos`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ donationId }),
  });
  return handleResponse(res);
}

export async function predictExpiry({ foodType, quantity, storageType, cookedAt }) {
  const res = await fetch(`${getBaseUrl()}/api/ai/predict-expiry`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ foodType, quantity, storageType, cookedAt }),
  });
  return handleResponse(res);
}

