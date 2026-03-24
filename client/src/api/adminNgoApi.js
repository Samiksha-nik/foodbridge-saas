const getBaseUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function getHeaders() {
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

export async function getPendingNgos() {
  const res = await fetch(`${getBaseUrl()}/api/admin/ngos/pending`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function approveNgo(id) {
  const res = await fetch(`${getBaseUrl()}/api/admin/ngos/${id}/approve`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

export async function rejectNgo(id) {
  const res = await fetch(`${getBaseUrl()}/api/admin/ngos/${id}/reject`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

