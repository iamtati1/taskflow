import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Plus, X } from "lucide-react";

import CalendarWidget from "../components/calendar/CalendarWidget";
import TaskList from "../components/tasks/TaskList";
import TasksLoadState from "../components/tasks/TasksLoadState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useTasks from "../hooks/useTasks";
import useTaskSheet, { quoted } from "../hooks/useTaskSheet";
import { useNotifications } from "../context/NotificationContext";
import { dueStatus } from "../utils/dates";
import { rise, stagger } from "../utils/motion";

function Tasks() {
    const taskState = useTasks();
    const {
        tasks,
        status,
        error,
        notice,
        dismissNotice,
        refreshTasks,
        removeTask,
        reorderTasks,
        activeActions,
    } = taskState;

    // Success is confirmed with a toast; failures keep their inline errors,
    // which stay until dismissed
    const { addNotification } = useNotifications();

    // Task details and the editor, in a sheet over the page
    const newTaskButton = useRef(null);
    const { openTaskId, openDetails, openEditor, openNewTask, closeSheet, toggle, dialog } =
        useTaskSheet(taskState, { newTaskButton });

    const isLoading = status === "loading";

    // ===============================
    // DELETE
    // ===============================
    const handleDelete = async (id) => {
        const task = tasks.find((t) => t.task_id === id);
        const result = await removeTask(id);
        if (result?.success && task) {
            // Don't leave a sheet open on a task that no longer exists
            if (openTaskId === id) closeSheet();
            addNotification(`Deleted ${quoted(task.title)}`, "success");
        }
        return result;
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

                <Button ref={newTaskButton} size="lg" leftIcon={Plus} onClick={() => openNewTask()}>
                    New Task
                </Button>
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
                            editingTaskId={openTaskId}
                            activeActions={activeActions}
                            onDelete={handleDelete}
                            onToggle={toggle}
                            onEdit={openEditor}
                            onOpen={openDetails}
                            onCreate={() => openNewTask()}
                            reorderTasks={reorderTasks}
                        />
                    </Card>
                </motion.div>

                <motion.div variants={rise}>
                    <CalendarWidget tasks={tasks} />
                </motion.div>
            </div>

            {dialog}
        </motion.div>
    );
}

export default Tasks;
