import { API_BASE } from "./config";

// =====================================================
// CORE FETCH WRAPPER
// =====================================================

const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      credentials: "include",
      ...options,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || "Request failed"
      );
    }

    return { data, error: null };

  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || "Network error",
      },
    };
  }
};

// =====================================================
// AUTH API (NAMED EXPORTS - FIXED)
// =====================================================

export const getMe = () => handleFetch("/api/auth/me");

export const register = (username, password) =>
  handleFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

export const login = (username, password) =>
  handleFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });

export const logout = () =>
  handleFetch("/api/auth/logout", {
    method: "DELETE",
  });

// =====================================================
// ACCOUNT (signed-in user)
// =====================================================

export const updateProfile = (username) =>
  handleFetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

export const changePassword = (currentPassword, newPassword) =>
  handleFetch("/api/users/me/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

/*
fetch("http://localhost:8080/api/auth/logout", {
method: "DELETE",
credentials: "include",
});

*/