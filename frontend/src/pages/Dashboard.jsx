import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ListChecks,
    Plus,
} from "lucide-react";

import useUISettings from "../hooks/useUISettings";
import useTasks from "../hooks/useTasks";
import { useNotifications } from "../context/NotificationContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import ProgressRing from "../components/ui/ProgressRing";
import TodaysFocus from "../components/dashboard/TodaysFocus";
import WorkflowInsight from "../components/dashboard/WorkflowInsight";
import UpcomingTasks from "../components/dashboard/UpcomingTasks";
import LatestTasks from "../components/dashboard/LatestTasks";
import TasksLoadState from "../components/tasks/TasksLoadState";
import { dueStatus, toDateKey } from "../utils/dates";
import { rise, stagger } from "../utils/motion";

const greetingFor = (hour) =>
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

// Most urgent first: overdue, then by due date; undated tasks last
const byUrgency = (a, b) => {
    const ka = toDateKey(a.due_date) ?? "9999-99-99";
    const kb = toDateKey(b.due_date) ?? "9999-99-99";
    return ka.localeCompare(kb);
};

function Dashboard() {
    const navigate = useNavigate();
    const { tasks = [], status, error, refreshTasks, toggleTask } = useTasks();
    const { addNotification } = useNotifications();

    const { aiSettings, quickSettings } = useUISettings();

    const focusMode = quickSettings?.["Focus Mode"];
    const aiEnabled = aiSettings?.["Productivity insights"];

    // =====================================================
    // TASK METRICS
    // =====================================================
    const total = tasks.length;
    const completed = tasks.filter((task) => Boolean(task.is_complete)).length;
    const active = total - completed;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const open = tasks.filter((task) => !task.is_complete);
    const kindOf = (task) => dueStatus(task.due_date)?.kind;
    const overdue = open.filter((task) => kindOf(task) === "overdue").length;
    const dueToday = open.filter((task) => kindOf(task) === "today").length;
    const needsAttention = overdue + dueToday;

    const upcoming = open
        .filter((task) => task.due_date)
        .sort(byUrgency);

    // The single most urgent task (any open task if none has a date)
    const priorityTask = [...open].sort(byUrgency)[0] || null;

    const newTask = () => navigate("/tasks", { state: { newTask: true } });

    const completeFocusTask = async (task) => {
        const result = await toggleTask(task.task_id);
        if (result?.success) addNotification(`Completed "${task.title}"`, "success");
        return Boolean(result?.success);
    };

    if (status === "loading" || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    return (
        <motion.section variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* =====================================================
                HERO
            ===================================================== */}
            <motion.div variants={rise}>
                <Card variant="hero" padding="xl" className="relative overflow-hidden">

                    <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-a">
                                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                            </p>

                            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                                {focusMode ? "Focus session" : greetingFor(new Date().getHours())}
                            </h1>

                            <p className="text-lg text-white/70">
                                {active} active {active === 1 ? "task" : "tasks"} •{" "}
                                {completed} completed
                            </p>

                            <p className={`flex items-center gap-2 text-sm ${needsAttention > 0 ? "text-amber-200" : "text-emerald-300"}`}>
                                {needsAttention > 0 ? (
                                    <>
                                        <AlertCircle size={16} aria-hidden="true" />
                                        {needsAttention} {needsAttention === 1 ? "task needs" : "tasks need"} your attention today
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} aria-hidden="true" />
                                        Nothing overdue or due today
                                    </>
                                )}
                            </p>

                            <div className="flex flex-wrap gap-3 pt-1">
                                <Button leftIcon={Plus} onClick={newTask}>
                                    New task
                                </Button>
                                <Button variant="secondary" rightIcon={ArrowRight} onClick={() => navigate("/tasks")}>
                                    Open Tasks
                                </Button>
                            </div>
                        </div>

                        {/* Beside its summary on phones, above it on wider screens */}
                        <div className="flex items-center gap-5 border-t border-white/[0.06] pt-6 md:flex-col md:gap-3 md:border-0 md:pt-0">
                            <ProgressRing value={progress} label="Tasks completed" caption="done" />
                            <p className="text-sm text-white/60 md:text-center">
                                <span className="tabular font-semibold text-white">{completed}</span> of{" "}
                                <span className="tabular">{total}</span> {total === 1 ? "task" : "tasks"}
                                <br className="hidden md:block" /> complete
                            </p>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* =====================================================
                STATS
            ===================================================== */}
            {!focusMode && (
                <motion.section
                    variants={stagger(0, 0.05)}
                    aria-labelledby="stats-heading"
                    className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
                >
                    {/* For screen readers: the numbers below are this section's h3s */}
                    <h2 id="stats-heading" className="sr-only">Task summary</h2>
                    <StatCard icon={ListChecks} value={active} label="Active" tone="accent" />
                    <StatCard icon={CalendarClock} value={dueToday} label="Due today" tone="amber" />
                    <StatCard icon={AlertCircle} value={overdue} label="Overdue" tone="rose" />
                    <StatCard icon={CheckCircle2} value={completed} label="Completed" tone="emerald" />
                </motion.section>
            )}

            {/* =====================================================
                FOCUS + INSIGHT, then UPCOMING + LATEST
                Rows, so each pair lines up; one column on phones.
            ===================================================== */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <motion.div variants={rise} className={focusMode ? "lg:col-span-2" : ""}>
                    <TodaysFocus
                        task={priorityTask}
                        total={total}
                        focusMode={focusMode}
                        onComplete={completeFocusTask}
                        onNewTask={newTask}
                    />
                </motion.div>

                {!focusMode && (
                    <>
                        <motion.div variants={rise}>
                            <WorkflowInsight
                                enabled={aiEnabled}
                                counts={{ total, active, completed, overdue, dueToday }}
                            />
                        </motion.div>

                        <motion.div variants={rise}>
                            <UpcomingTasks tasks={upcoming} />
                        </motion.div>

                        <motion.div variants={rise}>
                            <LatestTasks tasks={tasks} />
                        </motion.div>
                    </>
                )}
            </div>
        </motion.section>
    );
}

export default Dashboard;
