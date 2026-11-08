import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Plus, X } from "lucide-react";

import TaskCalendar from "../components/calendar/TaskCalendar";
import TaskList from "../components/tasks/TaskList";
import AddTaskForm from "../components/tasks/AddTaskForm";
import TasksLoadState from "../components/tasks/TasksLoadState";
import Card from "../components/ui/Card";
import Dialog from "../components/ui/Dialog";
import useTasks from "../hooks/useTasks";
import { useNotifications } from "../context/NotificationContext";
import { dueStatus } from "../utils/dates";
import { rise, stagger } from "../utils/motion";

// A task title for a toast, shortened so the toast stays small
const quoted = (title = "") =>
    `"${title.length > 60 ? `${title.slice(0, 60)}…` : title}"`;

const FORM_TITLE_ID = "task-form-title";

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
    // EDITOR
    // ===============================
    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const openNewTask = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    // Closing without saving puts focus back where new tasks start (the
    // dialog returns it to the opener instead when that was a button)
    const newTaskButton = useRef(null);
    const cancelForm = () => {
        closeModal();
        newTaskButton.current?.focus();
    };

    // The Dashboard's "New task" arrives here with { newTask: true }
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        if (location.state?.newTask) {
            openNewTask();
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, navigate]);

    // ===============================
    // SUMMARY
    // ===============================
    const activeCount = tasks.filter((task) => !task.is_complete).length;
    const completedCount = tasks.length - activeCount;
    const urgency = (kind) =>
        tasks.filter((task) => !task.is_complete && dueStatus(task.due_date)?.kind === kind).length;
    const overdueCount = urgency("overdue");
    const todayCount = urgency("today");

    if (isLoading || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    return (
        <motion.div variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={rise} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl">
                        Tasks
                    </h1>

                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
                        <span><span className="tabular font-semibold text-white">{activeCount}</span> active</span>
                        <span aria-hidden="true" className="text-white/20">•</span>
                        <span><span className="tabular font-semibold text-white">{completedCount}</span> completed</span>
                        {todayCount > 0 && (
                            <>
                                <span aria-hidden="true" className="text-white/20">•</span>
                                <span className="text-amber-200"><span className="tabular font-semibold">{todayCount}</span> due today</span>
                            </>
                        )}
                        {overdueCount > 0 && (
                            <>
                                <span aria-hidden="true" className="text-white/20">•</span>
                                <span className="text-rose-300"><span className="tabular font-semibold">{overdueCount}</span> overdue</span>
                            </>
                        )}
                    </p>
                </div>

                <motion.button
                    ref={newTaskButton}
                    type="button"
                    onClick={openNewTask}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-cyan-400)_70%,transparent)] transition-colors hover:bg-cyan-300"
                >
                    <Plus size={18} aria-hidden="true" />
                    New Task
                </motion.button>
            </motion.div>

            {/* ACTION ERRORS (the list stays visible) */}
            {notice && (
                <motion.div
                    role="alert"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                    <span className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{notice}</span>
                    </span>
                    <button
                        type="button"
                        onClick={dismissNotice}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-rose-200/80 hover:bg-rose-500/10 hover:text-white"
                    >
                        <X size={14} aria-hidden="true" />
                        Dismiss
                    </button>
                </motion.div>
            )}

            {/* LIST FIRST, CALENDAR BESIDE IT (BELOW ON SMALLER SCREENS) */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <motion.div variants={rise}>
                    <Card>
                        <TaskList
                            tasks={tasks}
                            editingTaskId={isModalOpen ? editingTask?.task_id : undefined}
                            activeActions={activeActions}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onCreate={openNewTask}
                            reorderTasks={reorderTasks}
                        />
                    </Card>
                </motion.div>

                <motion.div variants={rise}>
                    <Card>
                        <TaskCalendar tasks={tasks} />
                    </Card>
                </motion.div>
            </div>

            {/* EDITOR */}
            <Dialog open={isModalOpen} onClose={cancelForm} labelledBy={FORM_TITLE_ID}>
                <AddTaskForm
                    addTask={handleCreate}
                    updateTask={handleUpdate}
                    onCancel={cancelForm}
                    initialData={editingTask}
                    titleId={FORM_TITLE_ID}
                />
            </Dialog>
        </motion.div>
    );
}

export default Tasks;
