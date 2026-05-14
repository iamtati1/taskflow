const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Fetch failed. ${response.status} ${response.statusText}`);
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const fetchAllTasks = async () => {
  return handleFetch('/api/tasks');
};

export const createTask = async (title) => {
  return handleFetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
};

export const updateTask = async (task_id, updates) => {
  return handleFetch(`/api/tasks/${task_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};

export const deleteTask = async (task_id) => {
  return handleFetch(`/api/tasks/${task_id}`, { method: 'DELETE' });
};
