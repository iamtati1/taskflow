// =====================================================
// CORE FETCH WRAPPER
// =====================================================

const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
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
    body: JSON.stringify({ username, password }),
  });

export const logout = () =>
  handleFetch("/api/auth/logout", {
    method: "DELETE",
  });

/*
fetch("http://localhost:8080/api/auth/logout", {
method: "DELETE",
credentials: "include",
});

*/