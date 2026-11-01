// Task fields the database stores. Others the form collects (priority,
// description) are not saved, so they are never shown as changed.
export const STORED_TASK_FIELDS = ["title", "is_complete", "due_date"];

// The subset of an edit that the server will save
export const storedFields = (updates = {}) =>
    Object.fromEntries(
        Object.entries(updates).filter(
            ([key, value]) => STORED_TASK_FIELDS.includes(key) && value !== undefined
        )
    );

// Returns a new list with one task's fields replaced
export const replaceTask = (tasks, taskId, changes) =>
    tasks.map((task) =>
        task.task_id === taskId ? { ...task, ...changes } : task
    );
