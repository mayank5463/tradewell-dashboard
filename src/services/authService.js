import { apiFetch } from "./api";

export function signup({ name, email, password }) {
  return apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return apiFetch("/logout", {
    method: "POST",
  }).catch((err) => {
    console.warn("[LOGOUT] API failed but continuing:", err.message);
    return { success: true };
  });
}

export function checkAuth() {
  return apiFetch("/check-auth");
}

export function getProfile() {
  return apiFetch("/profile");
}

export function changePassword({ currentPassword, newPassword }) {
  return apiFetch("/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function updateProfile(profileData) {
  return apiFetch("/update-profile", {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
}