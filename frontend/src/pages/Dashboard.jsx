import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useUISettings from "../hooks/useUISettings";

import {
    Sparkles,
    CheckCircle2,
    Clock3,
    Lightbulb,
    ArrowRight,
    CalendarDays,
    Zap,
    Target,
} from "lucide-react";

import Card from "../components/ui/Card";
import LatestTasks from "../components/dashboard/LatestTasks";
import useTasks from "../hooks/useTasks";
import { formatDueDate, isOverdue, toDateKey } from "../utils/dates";

function Dashboard() {
    const navigate = useNavigate();
    const { tasks = [] } = useTasks();

    const { aiSettings, quickSettings } = useUISettings();

    const focusMode = quickSettings?.["Focus Mode"];
    const aiEnabled = aiSettings?.["Productivity insights"];

    // =====================================================
    // TASK METRICS
    // =====================================================

    const total = tasks.length;

    const completed = tasks.filter(
        (task) => Boolean(task.is_complete)
    ).length;

    const active = total - completed;

    const progress =
        total === 0
            ? 0
            : Math.round((completed / total) * 100);

    const upcoming = tasks
        .filter(
            (task) =>
                task.due_date &&
                !task.is_complete
        )
        .sort((a, b) =>
            toDateKey(a.due_date).localeCompare(toDateKey(b.due_date))
        )
        .slice(0, 3);

    const overdue = tasks.filter(
        (task) =>
            !task.is_complete &&
            isOverdue(task.due_date)
    );

    const streak = completed > 0 ? completed : 0;

    const priorityTask = upcoming[0] || null;

    // =====================================================
    // INSIGHTS
    // =====================================================

    const momentum =
        progress >= 75
            ? "You are operating with strong momentum."
            : progress >= 40
                ? "Steady progress is building."
                : "Focus on completing a few key tasks first.";

    const aiInsight =
        active > completed
            ? "Your workload is heavier than your completion rate. Consider reducing active tasks before adding new work."
            : "Your task distribution is healthy and sustainable.";

    // =====================================================
    // STATS
    // =====================================================

    const stats = [
        {
            icon: CheckCircle2,
            value: completed,
            label: "Completed",
        },
        {
            icon: Target,
            value: active,
            label: "Active",
        },
        {
            icon: Zap,
            value: `${progress}%`,
            label: "Progress",
        },
        {
            icon: Clock3,
            value: streak,
            label: "Momentum",
        },
    ];

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
        >
            {/* =====================================================
                HERO
            ===================================================== */}

            <Card className="relative overflow-hidden">
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

                <div className="relative max-w-3xl space-y-5">
                    <div className="flex items-center gap-2 text-blue-300">
                        <Sparkles size={16} />
                        Your workspace
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight">
                        {focusMode
                            ? "Focus Session Active"
                            : "Welcome back"}
                    </h1>

                    <p className="text-white/60 text-lg">
                        {active} active tasks •{" "}
                        {completed} completed
                    </p>

                    <p className="text-white/50">
                        {momentum}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() =>
                                navigate("/tasks")
                            }
                            className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-5 py-3 text-white transition hover:bg-blue-500/20"
                        >
                            Open Tasks
                            <ArrowRight size={16} />
                        </button>

                        <button
                            onClick={() =>
                                navigate("/analytics")
                            }
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-white/80 transition hover:bg-white/[0.06]"
                        >
                            Analytics
                        </button>
                    </div>
                </div>
            </Card>

            {/* =====================================================
                STATS
            ===================================================== */}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <Card key={stat.label}>
                            <Icon
                                size={18}
                                className="text-blue-300"
                            />

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

            {/* =====================================================
                FOCUS + INSIGHT
            ===================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 text-indigo-300">
                        <Target size={18} />
                        Today's Focus
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white">
                        {priorityTask?.title ||
                            "No priority task"}
                    </h3>

                    <p className="mt-2 text-white/60">
                        {focusMode
                            ? "Focus Mode is active. Concentrate on a single meaningful outcome."
                            : "Choose the next task that moves your work forward."}
                    </p>
                </Card>

                {aiEnabled ? (
                    <Card>
                        <div className="flex items-center gap-2 text-blue-300">
                            <Lightbulb size={18} />
                            Workflow Insight
                        </div>

                        <h3 className="mt-4 text-xl font-semibold text-white">
                            Your workload
                        </h3>

                        <p className="mt-2 text-white/60">
                            {aiInsight}
                        </p>
                    </Card>
                ) : (
                    <Card>
                        <div className="flex items-center gap-2 text-white/60">
                            <Lightbulb size={18} />
                            Insights are off
                        </div>

                        <p className="mt-4 text-white/50">
                            Turn on Workflow insights in Settings
                            to see a note about your workload.
                        </p>
                    </Card>
                )}
            </div>

            {/* =====================================================
                UPCOMING + LATEST TASKS
            ===================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 text-blue-300">
                        <CalendarDays size={18} />
                        Upcoming Tasks
                    </div>

                    <div className="mt-5 space-y-3">
                        {upcoming.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-white/50">
                                No upcoming tasks scheduled.
                            </div>
                        ) : (
                            upcoming.map((task) => (
                                <div
                                    key={task.task_id}
                                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                                >
                                    <p className="font-medium text-white">
                                        {task.title}
                                    </p>

                                    <p className="mt-1 text-sm text-white/50">
                                        Due{" "}
                                        {formatDueDate(task.due_date)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <LatestTasks tasks={tasks} />
            </div>

            {/* =====================================================
                SYSTEM STATUS
            ===================================================== */}

            <Card>
                <h3 className="text-lg font-semibold text-white">
                    Workspace Status
                </h3>

                <div className="mt-5 grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-sm text-white/50">
                            Total Tasks
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                            {total}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-sm text-white/50">
                            Overdue
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                            {overdue.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-sm text-white/50">
                            Completion Rate
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                            {progress}%
                        </p>
                    </div>
                </div>
            </Card>
        </motion.section>
    );
}

export default Dashboard;