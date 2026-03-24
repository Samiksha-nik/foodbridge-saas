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

export async function createDonation(payload) {
  const res = await fetch(`${getBaseUrl()}/api/provider/donations`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function uploadDonationPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getBaseUrl()}/api/provider/donations/upload-photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse(res);
}

export async function getProviderDonations(params = {}) {
  const url = new URL(`${getBaseUrl()}/api/provider/donations`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getSingleDonation(id) {
  const res = await fetch(`${getBaseUrl()}/api/provider/donations/${id}`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function updateDonation(id, payload) {
  const res = await fetch(`${getBaseUrl()}/api/provider/donations/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteDonation(id) {
  const res = await fetch(`${getBaseUrl()}/api/provider/donations/${id}`, {
    method: "DELETE",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  if (res.status === 204) return { success: true };
  return handleResponse(res);
}

export async function getDashboardStats() {
  const res = await fetch(
    `${getBaseUrl()}/api/provider/donations/stats`,
    {
      method: "GET",
      headers: getJsonHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(res);
}

export async function getMyDonations() {
  // Convenience wrapper for full provider history
  return getProviderDonations({ limit: 1000 });
}

export async function getProviderAiRecommendation() {
  const res = await fetch(
    `${getBaseUrl()}/api/providers/ai-recommendation`,
    {
      method: "GET",
      headers: getJsonHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(res);
}


