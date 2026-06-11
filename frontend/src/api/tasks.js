// =====================================================
// API BASE
// =====================================================

const API_BASE = "http://localhost:8080";

// =====================================================
// CORE FETCH WRAPPER
// =====================================================

const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: {
          message:
            data?.error ||
            data?.message ||
            `${response.status} ${response.statusText}`,
        },
      };
    }

    return {
      success: true,
      data,
      error: null,
    };

  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message || "Network error",
      },
    };
  }
};

// =====================================================
// TASK API
// =====================================================

export const taskApi = {
  // GET all tasks
  getTasks: () =>
    handleFetch("/api/tasks", {
      method: "GET",
      credentials: "include",
    }),

  // CREATE task
  createTask: (taskData) =>
    handleFetch("/api/tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    }),

  // UPDATE task
  updateTask: (taskId, updates) =>
    handleFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }),

  // DELETE task
  deleteTask: (taskId) =>
    handleFetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      credentials: "include",
    }),
};