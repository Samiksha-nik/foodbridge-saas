/**
 * Auth API for FoodBridge backend.
 * Uses HTTP-only JWT cookies (no tokens stored in frontend).
 * Base URL: VITE_API_URL or http://localhost:5000
 */
const getBaseUrl = () =>
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const PENDING_EMAIL_KEY = "pending_verify_email";

// These are kept for backwards compatibility but are no-ops in cookie mode.
export function getStoredToken() {
  return null;
}

export function setStoredToken(_token) {
  // no-op: auth handled via HTTP-only cookies
}

export function setPendingVerifyEmail(email) {
  if (email) sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  else sessionStorage.removeItem(PENDING_EMAIL_KEY);
}

export function getPendingVerifyEmail() {
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
}

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function register({ email, password, role }) {
  const res = await fetch(`${getBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, password, role }),
  });
  const out = await handleResponse(res);
  setPendingVerifyEmail(email);
  return out;
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${getBaseUrl()}/api/auth/verify-otp`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, otp }),
  });
  const out = await handleResponse(res);
  setPendingVerifyEmail(null);
  return out;
}

export async function login(email, password) {
  const res = await fetch(`${getBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const out = await handleResponse(res);
  return out;
}

export async function getMe() {
  const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
    headers: getHeaders(),
    credentials: "include",
  });
  const out = await handleResponse(res);
  if (!out.data) throw new Error("No user data");
  return out.data;
}

export async function completeProfile(payload) {
  const res = await fetch(`${getBaseUrl()}/api/users/complete-profile`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function forgotPassword(email) {
  const res = await fetch(`${getBaseUrl()}/api/auth/forgot-password`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function resetPassword(token, password) {
  const res = await fetch(`${getBaseUrl()}/api/auth/reset-password/${encodeURIComponent(token)}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}

export async function sendOtp(email) {
  const res = await fetch(`${getBaseUrl()}/api/auth/send-otp`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function logout() {
  const res = await fetch(`${getBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function updateProviderProfile(payload) {
  const res = await fetch(`${getBaseUrl()}/api/providers/profile`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateNgoProfile(payload) {
  const res = await fetch(`${getBaseUrl()}/api/ngos/profile`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getNgoPerformance() {
  const res = await fetch(`${getBaseUrl()}/api/ngos/performance`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${getBaseUrl()}/api/auth/change-password`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res);
}

export async function deleteAccount() {
  const res = await fetch(`${getBaseUrl()}/api/auth/account`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

export async function checkUser(email) {
  const url = new URL(`${getBaseUrl()}/api/auth/check-user`);
  url.searchParams.set("email", email);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  return handleResponse(res);
}

