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
    const error = new Error(data?.message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function getUserNotifications(userId, limit = 20) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  const res = await fetch(
    `${getBaseUrl()}/api/notifications/${userId}?${params.toString()}`,
    {
      method: "GET",
      headers: getJsonHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(res);
}

export async function markNotificationRead(id) {
  const res = await fetch(`${getBaseUrl()}/api/notifications/read/${id}`, {
    method: "PUT",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function createNotification(payload) {
  const res = await fetch(`${getBaseUrl()}/api/notifications`, {
    method: "POST",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

