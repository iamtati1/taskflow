import { useState, useMemo, useRef } from "react";

import TaskCalendar from "../components/calendar/TaskCalendar";
import TaskList from "../components/tasks/TaskList";
import AddTaskForm from "../components/tasks/AddTaskForm";
import TasksLoadState from "../components/tasks/TasksLoadState";
import useTasks from "../hooks/useTasks";
import { useNotifications } from "../context/NotificationContext";

import { CheckCircle2, ListTodo } from "lucide-react";

// A task title for a toast, shortened so the toast stays small
const quoted = (title = "") =>
    `"${title.length > 60 ? `${title.slice(0, 60)}…` : title}"`;

// =====================================================
// CARD
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div
            className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}
        >
            {children}
        </div>
    );
}

function Tasks() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const {
        tasks,
        status,
        error,
        notice,
        dismissNotice,
        refreshTasks,
        addTask,
        editTask,
        toggleTask,
        removeTask,
        reorderTasks,
        activeActions,
    } = useTasks();

    // Success is confirmed with a toast; failures keep their inline errors,
    // which stay until dismissed
    const { addNotification } = useNotifications();

    // ===============================
    // FIX: safe loading state
    // ===============================
    const isLoading = status === "loading";

    // ===============================
    // CREATE
    // ===============================
    const handleCreate = async (data) => {
        const result = await addTask(data);
        // Keep the form open on failure so the error is visible and the text isn't lost
        if (result?.success) {
            closeModal();
            addNotification(`Added ${quoted(result.data?.title ?? data.title)}`, "success");
        }
        return result;
    };

    // ===============================
    // UPDATE
    // ===============================
    const handleUpdate = async (id, data) => {
        const result = await editTask(id, data);
        // Keep the form open on failure so the error is visible and the edit isn't lost
        if (result?.success) {
            closeModal();
            addNotification(`Saved ${quoted(result.data?.title)}`, "success");
        }
        return result;
    };

    // ===============================
    // COMPLETE / REOPEN
    // ===============================
    const handleToggle = async (id) => {
        const task = tasks.find((t) => t.task_id === id);
        const result = await toggleTask(id);
        if (result?.success && task) {
            addNotification(
                task.is_complete
                    ? `Moved ${quoted(task.title)} back to active`
                    : `Completed ${quoted(task.title)}`,
                "success"
            );
        }
        return result;
    };

    // ===============================
    // DELETE
    // ===============================
    const handleDelete = async (id) => {
        const task = tasks.find((t) => t.task_id === id);
        const result = await removeTask(id);
        if (result?.success && task) {
            // Don't leave the editor open on a task that no longer exists
            if (editingTask?.task_id === id) closeModal();
            addNotification(`Deleted ${quoted(task.title)}`, "success");
        }
        return result;
    };

    // ===============================
    // EDIT
    // ===============================
    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    // ===============================
    // CLOSE MODAL
    // ===============================
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    // ===============================
    // OPEN NEW TASK (IMPORTANT FIX)
    // ===============================
    const openNewTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    // Closing without saving puts focus back where new tasks start
    const newTaskButton = useRef(null);
    const cancelForm = () => {
        closeModal();
        newTaskButton.current?.focus();
    };


    // ===============================
    // STATS
    // ===============================
    const completedTasks = tasks.filter(
        (task) => task.is_complete
    ).length;

    const stats = useMemo(
        () => [
            {
                icon: ListTodo,
                label: "Total",
                value: tasks.length,
            },
            {
                icon: CheckCircle2,
                label: "Completed",
                value: completedTasks,
            },
        ],
        [tasks, completedTasks]
    );

    // ===============================
    // LOADING / ERROR STATES
    // ===============================
    if (isLoading || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    return (
        <div className="space-y-10">

            {/* HEADER */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <ListTodo size={16} />
                        Task System
                    </div>

                    <h1 className="text-3xl font-bold text-white">
                        Your tasks, structured
                    </h1>

                    <p className="text-white/60 max-w-xl">
                        Plan, organize, and execute your work with clarity and momentum.
                    </p>
                </div>

                <button
                    ref={newTaskButton}
                    type="button"
                    onClick={openNewTask}
                    className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-white transition hover:bg-cyan-400/15"
                >
                    + New Task
                </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <Card key={stat.label}>
                            <Icon size={18} className="text-cyan-300" />

                            <h3 className="mt-4 text-3xl font-bold text-white">
                                {stat.value}
                            </h3>

                            <p className="mt-1 text-sm text-white/50">
                                {stat.label}
                            </p>
                        </Card>
                    );
                })}
            </div>

            {/* ACTION ERRORS (the list stays visible) */}
            {notice && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                    <span>{notice}</span>
                    <button
                        type="button"
                        onClick={dismissNotice}
                        className="shrink-0 text-red-200/80 hover:text-white"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <Card className="xl:col-span-1">
                    <TaskCalendar
                        tasks={tasks}
                    />
                </Card>

                <Card className="xl:col-span-2">
                    <TaskList
                        tasks={tasks}
                        editingTaskId={editingTask?.task_id}
                        activeActions={activeActions}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        reorderTasks={reorderTasks}
                    />
                </Card>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <AddTaskForm
                    addTask={handleCreate}
                    updateTask={handleUpdate}
                    onCancel={cancelForm}
                    initialData={editingTask}
                />
            )}

        </div>
    );
}

export default Tasks;