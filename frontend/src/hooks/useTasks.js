import { useState, useEffect, useCallback, useMemo } from "react";
import { taskApi } from "../api/tasks";

// =====================================================
// HELPERS
// =====================================================
const normalizeTasks = (data) => {
    const raw = data?.tasks || data || [];

    if (!Array.isArray(raw)) return [];

    return raw.filter((task) => task && task.task_id);
};

// =====================================================
// HOOK
// =====================================================
function useTasks() {

    // =====================================================
    // CORE STATE
    // =====================================================
    const [tasks, setTasks] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // =====================================================
    // SELECTION
    // =====================================================
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const onSelect = useCallback((taskId) => {
        setSelectedTaskId((prev) =>
            prev === taskId ? null : taskId
        );
    }, []);

    // =====================================================
    // ACTION TRACKING
    // =====================================================
    const [activeActions, setActiveActions] = useState({});

    const setAction = (taskId, action) => {
        setActiveActions((prev) => ({
            ...prev,
            [taskId]: action,
        }));
    };

    const clearAction = (taskId) => {
        setActiveActions((prev) => {
            const copy = { ...prev };
            delete copy[taskId];
            return copy;
        });
    };

    // =====================================================
    // LOAD TASKS
    // =====================================================
    const loadTasks = useCallback(
        async ({ silent = false } = {}) => {
            try {
                setError(null);

                setStatus(
                    silent ? "refreshing" : "loading"
                );

                const res = await taskApi.getTasks();

                if (!res.success) {
                    throw new Error(
                        res.error?.message ||
                        "Failed to load tasks"
                    );
                }

                setTasks(normalizeTasks(res.data));
                setLastUpdated(new Date());

            } catch (err) {
                setError(
                    err.message || "Failed to load tasks"
                );
            } finally {
                setStatus("idle");
            }
        },
        []
    );

    // =====================================================
    // CREATE TASK
    // =====================================================
    const addTask = useCallback(async (taskData) => {

        setStatus("mutating");

        const tempId = `temp-${Date.now()}`;

        const optimisticTask = {
            task_id: tempId,
            ...taskData,
            is_complete: false,
            _optimistic: true,
        };

        setTasks((prev) => [
            optimisticTask,
            ...prev,
        ]);

        try {
            const res = await taskApi.createTask(taskData);

            if (!res.success) {
                throw new Error(
                    res.error?.message ||
                    "Failed to create task"
                );
            }

            setTasks((prev) =>
                prev.map((task) =>
                    task.task_id === tempId
                        ? res.data
                        : task
                )
            );

            return {
                success: true,
                data: res.data,
            };

        } catch (err) {

            setError(err.message);

            setTasks((prev) =>
                prev.filter(
                    (task) =>
                        task.task_id !== tempId
                )
            );

            return {
                success: false,
                error: err.message,
            };

        } finally {
            setStatus("idle");
        }
    }, []);

    // =====================================================
    // TOGGLE COMPLETE
    // =====================================================
    const toggleTask = useCallback(async (taskId) => {

        setAction(taskId, "toggle");

        let snapshot;

        setTasks((prev) => {
            snapshot = prev;

            return prev.map((task) =>
                task.task_id === taskId
                    ? {
                        ...task,
                        is_complete:
                            !task.is_complete,
                    }
                    : task
            );
        });

        const task = snapshot?.find(
            (t) => t.task_id === taskId
        );

        if (!task) {
            clearAction(taskId);

            return {
                success: false,
                error: "Task not found",
            };
        }

        try {
            const res =
                await taskApi.updateTask(
                    taskId,
                    {
                        is_complete:
                            !task.is_complete,
                    }
                );

            if (!res.success) {
                throw new Error(
                    res.error?.message ||
                    "Failed to update task"
                );
            }

            return { success: true };

        } catch (err) {

            setError(err.message);
            setTasks(snapshot);

            return {
                success: false,
                error: err.message,
            };

        } finally {
            clearAction(taskId);
        }
    }, []);

    // =====================================================
    // EDIT TASK
    // =====================================================
    const editTask = useCallback(
        async (taskId, updates) => {

            setAction(taskId, "update");

            let snapshot;

            setTasks((prev) => {
                snapshot = prev;

                return prev.map((task) =>
                    task.task_id === taskId
                        ? {
                            ...task,
                            ...updates,
                        }
                        : task
                );
            });

            try {
                const res =
                    await taskApi.updateTask(
                        taskId,
                        updates
                    );

                if (!res.success) {
                    throw new Error(
                        res.error?.message ||
                        "Failed to update task"
                    );
                }

                return {
                    success: true,
                };

            } catch (err) {

                setError(err.message);
                setTasks(snapshot);

                return {
                    success: false,
                    error: err.message,
                };

            } finally {
                clearAction(taskId);
            }
        },
        []
    );

    // =====================================================
    // DELETE TASK
    // =====================================================
    const removeTask = useCallback(
        async (taskId) => {

            setAction(taskId, "delete");

            let snapshot;

            setTasks((prev) => {
                snapshot = prev;

                return prev.filter(
                    (task) =>
                        task.task_id !== taskId
                );
            });

            try {
                const res =
                    await taskApi.deleteTask(taskId);

                if (!res.success) {
                    throw new Error(
                        res.error?.message ||
                        "Failed to delete task"
                    );
                }

                return {
                    success: true,
                };

            } catch (err) {

                setError(err.message);
                setTasks(snapshot);

                return {
                    success: false,
                    error: err.message,
                };

            } finally {
                clearAction(taskId);
            }
        },
        []
    );

    // =====================================================
    // DRAG + DROP
    // =====================================================
    const reorderTasks = useCallback(
        (fromIndex, toIndex) => {
            setTasks((prev) => {
                const copy = [...prev];

                const [moved] =
                    copy.splice(fromIndex, 1);

                copy.splice(
                    toIndex,
                    0,
                    moved
                );

                return copy;
            });
        },
        []
    );

    // =====================================================
    // DERIVED STATE
    // =====================================================
    const completedTasks = useMemo(
        () =>
            tasks.filter(
                (task) => task.is_complete
            ),
        [tasks]
    );

    const activeTasks = useMemo(
        () =>
            tasks.filter(
                (task) => !task.is_complete
            ),
        [tasks]
    );

    const stats = useMemo(
        () => ({
            total: tasks.length,
            completed:
                completedTasks.length,
            active: activeTasks.length,
        }),
        [
            tasks,
            completedTasks,
            activeTasks,
        ]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================
    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    // =====================================================
    // PUBLIC API
    // =====================================================
    return {
        tasks,

        status,
        error,
        lastUpdated,

        selectedTaskId,
        onSelect,

        addTask,
        editTask,
        toggleTask,
        removeTask,

        reorderTasks,
        refreshTasks: loadTasks,

        completedTasks,
        activeTasks,
        stats,

        activeActions,
    };
}

export default useTasks;