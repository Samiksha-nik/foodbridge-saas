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

export async function getAdminDashboard() {
  const res = await fetch(`${getBaseUrl()}/api/admin/dashboard`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getAdminUsers() {
  const res = await fetch(`${getBaseUrl()}/api/admin/users`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function patchAdminUser(id, body) {
  const res = await fetch(`${getBaseUrl()}/api/admin/users/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function getAdminDonations() {
  const res = await fetch(`${getBaseUrl()}/api/admin/donations`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function getAdminAnalytics() {
  const res = await fetch(`${getBaseUrl()}/api/admin/analytics`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

/** @param {{ status?: string, limit?: number }} [params] */
export async function getAdminFraudAlerts(params = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  const url = `${getBaseUrl()}/api/admin/fraud-alerts${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function patchAdminFraudAlert(id, body) {
  const res = await fetch(`${getBaseUrl()}/api/admin/fraud-alerts/${id}`, {
    method: "PATCH",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function resolveAdminFraudAlert(id) {
  const res = await fetch(`${getBaseUrl()}/api/admin/fraud-alerts/${id}/resolve`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}
