import { useState, useEffect, useCallback, useMemo } from "react";

import {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
} from "../api/tasks";

function useTasks() {
    // =====================================================
    // STATE
    // =====================================================

    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // =====================================================
    // LOAD TASKS
    // =====================================================

    const loadTasks = useCallback(async ({ silent = false } = {}) => {
        try {
            setError(null);

            setIsLoading(!silent);
            setIsRefreshing(silent);

            const res = await getTasks();

            if (!res?.success) {
                throw new Error(res?.error?.message || "Failed to load tasks");
            }

            const raw = res.data;

            const normalizedTasks = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.tasks)
                    ? raw.tasks
                    : [];

            setTasks(normalizedTasks);
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

            const res = await createTask(taskData);

            if (!res.success) {
                throw new Error(res.error?.message || "Failed to create task");
            }

            setTasks((prev) => [res.data, ...prev]);
            console.log("TASKS ARRAY:", tasks);
            return { success: true, data: res.data };

        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    }, []);

    // =====================================================
    // UPDATE (OPTIMISTIC)
    // =====================================================

    const editTask = useCallback(async (taskId, updates) => {
        const previous = [...tasks];

        setTasks((prev) =>
            prev.map((t) =>
                t.task_id === taskId ? { ...t, ...updates } : t

            )
        );

        try {
            const res = await updateTask(taskId, updates);
            console.error("BAD TASK AT INDEX:", index, tasks); console.error("TASKS DEBUG:", tasks); if (!res.success) {
                throw new Error(res.error?.message || "Update failed");
            }

            return { success: true };

        } catch (err) {
            setTasks(previous); // rollback
            setError(err.message);

            return { success: false, error: err.message };
        }
    }, [tasks]);

    // =====================================================
    // DELETE (OPTIMISTIC)
    // =====================================================

    const removeTask = useCallback(async (taskId) => {
        const previous = [...tasks];

        setTasks((prev) =>
            prev.filter((t) => t.task_id !== taskId)
        );

        try {
            const res = await deleteTask(taskId);

            if (!res.success) {
                throw new Error(res.error?.message || "Delete failed");
            }

            return { success: true };

        } catch (err) {
            setTasks(previous); // rollback
            setError(err.message);

            return { success: false, error: err.message };
        }
    }, [tasks]);

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
    // API
    // =====================================================

    return {
        tasks,

        isLoading,
        isRefreshing,
        error,
        lastUpdated,

        completedTasks,
        activeTasks,
        highPriorityTasks,

        loadTasks,
        addTask,
        editTask,
        removeTask,
    };
}

export default useTasks;