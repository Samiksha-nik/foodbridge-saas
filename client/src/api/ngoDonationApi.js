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

function mapBackendDonation(d) {
  if (!d) return null;
  const urgency = d.expiryRiskLevel || "medium";
  return {
    id: d._id || d.id,
    food_name: d.foodName,
    category: d.category,
    quantity: `${d.quantity} ${d.quantityUnit}`,
    urgency,
    photo_url: d.photoUrl,
    pickup_location: d.pickupLocation?.address || "",
    predicted_expiry: "",
    created_date: d.createdAt,
    provider_name: d.providerName || "",
    status: d.status,
    delivery_proof_urls: d.deliveryProofUrls || [],
    mealsEquivalent: d.mealsEquivalent || 0,
    provider_id: d.providerId?.toString?.() || d.providerId || "",
  };
}

export async function getAvailableDonations() {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/available`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  const out = await handleResponse(res);
  return {
    ...out,
    data: (out.data || []).map(mapBackendDonation),
  };
}

export async function getMyDonations() {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/my`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  const out = await handleResponse(res);
  return {
    ...out,
    data: (out.data || []).map(mapBackendDonation),
  };
}

export async function getNgoAnalytics(days = 30) {
  const params = new URLSearchParams();
  params.set("days", String(days));

  const res = await fetch(
    `${getBaseUrl()}/api/ngo/analytics?${params.toString()}`,
    {
      method: "GET",
      headers: getJsonHeaders(),
      credentials: "include",
    }
  );
  return handleResponse(res);
}

export async function getSingleDonation(id) {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/${id}`, {
    method: "GET",
    headers: getJsonHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function acceptDonation(id) {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/${id}/accept`, {
    method: "PUT",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

export async function markPickedUp(id) {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/${id}/pickup`, {
    method: "PUT",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

export async function markDelivered(id, deliveryProofUrls = []) {
  const res = await fetch(`${getBaseUrl()}/api/ngo/donations/${id}/deliver`, {
    method: "PUT",
    headers: getJsonHeaders(),
    credentials: "include",
    body: JSON.stringify({ deliveryProofUrls }),
  });
  return handleResponse(res);
}

