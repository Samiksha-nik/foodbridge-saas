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

export async function createPickupRequest(body) {
  const res = await fetch(`${getBaseUrl()}/api/pickup-requests`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function getProviderPickupRequests() {
  const res = await fetch(`${getBaseUrl()}/api/pickup-requests/provider`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getNgoPickupRequests() {
  const res = await fetch(`${getBaseUrl()}/api/pickup-requests/ngo`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function respondToPickupRequest(id, action) {
  const res = await fetch(`${getBaseUrl()}/api/pickup-requests/${id}/respond`, {
    method: "PATCH",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  return handleResponse(res);
}

