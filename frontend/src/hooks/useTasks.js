import { useState, useEffect, useCallback, useMemo } from "react";

import { taskApi } from "../api/tasks";

// =====================================================
// HELPERS (DATA SAFETY)
// =====================================================

const normalizeTasks = (data) => {
    const raw =
        data?.tasks ||
        data ||
        [];

    if (!Array.isArray(raw)) return [];

    return raw.filter((t) =>
        t &&
        typeof t === "object" &&
        t.task_id
    );
};

// =====================================================
// HOOK
// =====================================================

function useTasks() {

    // =====================================================
    // STATE
    // =====================================================

    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [focusedTaskId, setFocusedTaskId] = useState(null);

    // =====================================================
    // LOAD TASKS
    // =====================================================

    const loadTasks = useCallback(async ({ silent = false } = {}) => {
        try {
            setError(null);
            setIsLoading(!silent);
            setIsRefreshing(silent);

            const res = await taskApi.getTasks();

            console.log("🔥 RAW API RESPONSE:", res);

            if (!res.success) {
                throw new Error(res.error?.message || "Failed to load tasks");
            }

            const cleanTasks = normalizeTasks(res.data);

            setTasks(cleanTasks);
            setLastUpdated(new Date());

        } catch (err) {
            setError(err.message || "Failed to load tasks");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // =====================================================
    // CREATE
    // =====================================================

    const addTask = useCallback(async (taskData) => {
        try {
            setError(null);

            const res = await taskApi.createTask(taskData);

            if (!res.success) {
                throw new Error(res.error?.message || "Failed to create task");
            }

            const newTask = res.data;

            if (!newTask?.task_id) return;

            setTasks((prev) => [newTask, ...prev]);

            return { success: true, data: newTask };

        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // =====================================================
    // UPDATE (OPTIMISTIC)
    // =====================================================

    const editTask = useCallback(async (taskId, updates) => {
        const previous = tasks;

        setTasks((prev) =>
            prev.map((t) =>
                t.task_id === taskId ? { ...t, ...updates } : t
            )
        );

        try {
            const res = await taskApi.updateTask(taskId, updates);

            if (!res.success) {
                throw new Error(res.error?.message || "Update failed");
            }

            return { success: true };

        } catch (err) {
            setTasks(previous);
            setError(err.message);

            return { success: false, error: err.message };
        }
    }, [tasks]);

    // =====================================================
    // TOGGLE
    // =====================================================

    const toggleTask = useCallback(async (taskId) => {
        const task = tasks.find((t) => t.task_id === taskId);

        if (!task) return;

        return editTask(taskId, {
            is_complete: !task.is_complete,
        });
    }, [tasks, editTask]);

    // =====================================================
    // DELETE (OPTIMISTIC)
    // =====================================================

    const removeTask = useCallback(async (taskId) => {
        const previous = tasks;

        setTasks((prev) =>
            prev.filter((t) => t.task_id !== taskId)
        );

        try {
            const res = await taskApi.deleteTask(taskId);

            if (!res.success) {
                throw new Error(res.error?.message || "Delete failed");
            }

            return { success: true };

        } catch (err) {
            setTasks(previous);
            setError(err.message);

            return { success: false, error: err.message };
        }
    }, [tasks]);

    // =====================================================
    // SELECTION
    // =====================================================

    const onSelect = useCallback((id) => {
        setSelectedTaskId((prev) => prev === id ? null : id);
        setFocusedTaskId(id);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedTaskId(null);
        setFocusedTaskId(null);
    }, []);

    // =====================================================
    // DERIVED STATE
    // =====================================================

    const completedTasks = useMemo(
        () => tasks.filter((t) => t.is_complete),
        [tasks]
    );

    const activeTasks = useMemo(
        () => tasks.filter((t) => !t.is_complete),
        [tasks]
    );

    const highPriorityTasks = useMemo(
        () => tasks.filter((t) => t.priority === "high"),
        [tasks]
    );

    // =====================================================
    // INIT
    // =====================================================

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // =====================================================
    // SAFE EXPORT (FINAL PROTECTION LAYER)
    // =====================================================

    const safeTasks = Array.isArray(tasks) ? tasks : [];

    // =====================================================
    // PUBLIC API
    // =====================================================

    return {
        tasks: safeTasks,

        isLoading,
        isRefreshing,
        error,
        lastUpdated,

        selectedTaskId,
        focusedTaskId,
        onSelect,
        clearSelection,

        addTask,
        editTask,
        toggleTask,
        removeTask,

        completedTasks,
        activeTasks,
        highPriorityTasks,

        loadTasks,
    };
}

export default useTasks;