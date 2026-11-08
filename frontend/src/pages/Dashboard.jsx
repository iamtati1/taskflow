import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Circle,
    Lightbulb,
    ListChecks,
    Plus,
    Target,
} from "lucide-react";

import useUISettings from "../hooks/useUISettings";
import useTasks from "../hooks/useTasks";
import { useNotifications } from "../context/NotificationContext";
import Card from "../components/ui/Card";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressRing from "../components/ui/ProgressRing";
import DueChip from "../components/tasks/DueChip";
import LatestTasks from "../components/dashboard/LatestTasks";
import TasksLoadState from "../components/tasks/TasksLoadState";
import { dueStatus, toDateKey } from "../utils/dates";
import { EASE_OUT, rise, stagger } from "../utils/motion";

const greetingFor = (hour) =>
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

// Most urgent first: overdue, then by due date; undated tasks last
const byUrgency = (a, b) => {
    const ka = toDateKey(a.due_date) ?? "9999-99-99";
    const kb = toDateKey(b.due_date) ?? "9999-99-99";
    return ka.localeCompare(kb);
};

const TILE_TONES = {
    cyan: "text-cyan-300 bg-cyan-400/10",
    amber: "text-amber-200 bg-amber-400/10",
    rose: "text-rose-300 bg-rose-500/10",
    emerald: "text-emerald-300 bg-emerald-400/10",
};

function StatTile({ icon: Icon, value, label, tone }) {
    return (
        <motion.div variants={rise}>
            <Card padding="md" className="h-full sm:p-5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${TILE_TONES[tone]}`}>
                    <Icon size={18} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-3xl font-bold text-white">
                    <AnimatedNumber value={value} />
                </h3>
                <p className="mt-0.5 text-sm text-white/55">
                    {label}
                </p>
            </Card>
        </motion.div>
    );
}

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
        .sort(byUrgency)
        .slice(0, 5);

    // The single most urgent task (any open task if none has a date)
    const priorityTask = [...open].sort(byUrgency)[0] || null;

    const completeFocusTask = async () => {
        if (!priorityTask) return;
        const result = await toggleTask(priorityTask.task_id);
        if (result?.success) addNotification(`Completed "${priorityTask.title}"`, "success");
    };

    // =====================================================
    // INSIGHT (rule of thumb, shown when enabled in Settings)
    // =====================================================
    const insight =
        total === 0
            ? "Add a few tasks and this note will reflect how your workload is going."
            : overdue > 0
                ? `${overdue} ${overdue === 1 ? "task is" : "tasks are"} overdue. Finishing or rescheduling ${overdue === 1 ? "it" : "them"} first will lighten everything else.`
                : active > completed
                    ? "You have more open than finished work. Consider closing a few tasks before adding new ones."
                    : "Your workload looks balanced. Nice work keeping on top of things.";

    if (status === "loading" || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    return (
        <motion.section variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* =====================================================
                HERO
            ===================================================== */}
            <motion.div variants={rise}>
                <Card variant="glow" padding="xl" className="relative overflow-hidden">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-[90px]" />

                    <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
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
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate("/tasks", { state: { newTask: true } })}
                                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    New task
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate("/tasks")}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.09]"
                                >
                                    Open Tasks
                                    <ArrowRight size={16} aria-hidden="true" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 self-start md:self-center">
                            <ProgressRing value={progress} label="Tasks completed" caption="done" />
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* =====================================================
                STATS
            ===================================================== */}
            {!focusMode && (
                <motion.div variants={stagger(0, 0.05)} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatTile icon={ListChecks} value={active} label="Active" tone="cyan" />
                    <StatTile icon={CalendarClock} value={dueToday} label="Due today" tone="amber" />
                    <StatTile icon={AlertCircle} value={overdue} label="Overdue" tone="rose" />
                    <StatTile icon={CheckCircle2} value={completed} label="Completed" tone="emerald" />
                </motion.div>
            )}

            {/* =====================================================
                FOCUS + UPCOMING / INSIGHT + LATEST
            ===================================================== */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                    <motion.div variants={rise}>
                        <Card>
                            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                                <Target size={16} aria-hidden="true" />
                                Today's Focus
                            </h2>

                            <AnimatePresence mode="wait" initial={false}>
                                {priorityTask ? (
                                    <motion.div
                                        key={priorityTask.task_id}
                                        initial={{ opacity: 0, x: 16 }}
                                        animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
                                        exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                                        className="mt-4 flex items-start gap-4"
                                    >
                                        <button
                                            type="button"
                                            onClick={completeFocusTask}
                                            aria-label={`Complete "${priorityTask.title}"`}
                                            className="group mt-1 shrink-0 rounded-full text-white/35 transition-colors hover:text-emerald-300"
                                        >
                                            <Circle size={26} className="group-hover:hidden" aria-hidden="true" />
                                            <CheckCircle2 size={26} className="hidden group-hover:block" aria-hidden="true" />
                                        </button>
                                        <div className="min-w-0 space-y-2">
                                            <h3 className="break-words text-xl font-semibold text-white">
                                                {priorityTask.title}
                                            </h3>
                                            <DueChip dueDate={priorityTask.due_date} />
                                            <p className="text-sm text-white/55">
                                                {focusMode
                                                    ? "Focus Mode is on. One outcome at a time."
                                                    : "The most urgent thing on your list right now."}
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.p
                                        key="none"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 text-white/55"
                                    >
                                        No priority task. Everything is done, or nothing is planned yet.
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>

                    {!focusMode && (
                        <motion.div variants={rise}>
                            <Card>
                                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                                    <CalendarDays size={16} aria-hidden="true" />
                                    Upcoming Tasks
                                </h2>

                                {upcoming.length === 0 ? (
                                    <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/50">
                                        No upcoming tasks scheduled. Give a task a due date to see it here.
                                    </div>
                                ) : (
                                    <ul className="mt-4 space-y-2">
                                        {upcoming.map((task) => (
                                            <li
                                                key={task.task_id}
                                                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3
                                                    ${dueStatus(task.due_date)?.kind === "overdue"
                                                        ? "border-rose-400/20 bg-rose-500/[0.06]"
                                                        : "border-white/[0.07] bg-white/[0.03]"}`}
                                            >
                                                <p className="min-w-0 break-words font-medium text-white">
                                                    {task.title}
                                                </p>
                                                <DueChip dueDate={task.due_date} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </motion.div>
                    )}
                </div>

                {!focusMode && (
                    <div className="space-y-6">
                        {aiEnabled ? (
                            <motion.div variants={rise}>
                                <Card>
                                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
                                        <Lightbulb size={16} aria-hidden="true" />
                                        Workflow Insight
                                    </h2>
                                    <p className="mt-3 leading-relaxed text-white/75">
                                        {insight}
                                    </p>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div variants={rise}>
                                <Card variant="subtle">
                                    <p className="flex items-center gap-2 text-sm text-white/55">
                                        <Lightbulb size={16} aria-hidden="true" />
                                        Insights are off. Turn on Workflow insights in Settings to see a note about your workload.
                                    </p>
                                </Card>
                            </motion.div>
                        )}

                        <motion.div variants={rise}>
                            <LatestTasks tasks={tasks} />
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.section>
    );
}

export default Dashboard;
