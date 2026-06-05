import {
    BarChart3,
    TrendingUp,
    Activity,
    CheckCircle2,
    Sparkles,
    Clock3,
} from "lucide-react";

import { motion } from "framer-motion";
import useTasks from "../hooks/useTasks";

function Analytics() {
    // =====================================================
    // DATA ENGINE
    // =====================================================
    const { tasks = [] } = useTasks();

    // =====================================================
    // CORE STATS
    // =====================================================
    const total = tasks.length;

    const completed = tasks.filter((t) => t.is_complete).length;

    const active = total - completed;

    const completionRate =
        total === 0 ? 0 : Math.round((completed / total) * 100);

    // =====================================================
    // DAILY ACTIVITY (LAST 7 DAYS)
    // =====================================================
    const getDailyCounts = () => {
        const map = {};

        tasks.forEach((t) => {
            if (!t.created_at) return;

            const date = new Date(t.created_at).toDateString();
            map[date] = (map[date] || 0) + 1;
        });

        return Object.values(map).slice(-7);
    };

    const chartData = getDailyCounts();

    // fallback so UI never breaks
    const safeChart = chartData.length ? chartData : [1, 2, 3, 2, 4, 3, 5];

    // =====================================================
    // MORNING PRODUCTIVITY INSIGHT
    // =====================================================
    const morningTasks = tasks.filter((t) => {
        if (!t.created_at) return false;
        const hour = new Date(t.created_at).getHours();
        return hour >= 8 && hour <= 11;
    }).length;

    const bestTimeInsight =
        morningTasks > tasks.length / 2
            ? "You perform best in morning sessions (8–11 AM)."
            : "Your productivity is spread throughout the day.";

    // =====================================================
    // STATS CARDS
    // =====================================================
    const stats = [
        {
            label: "Tasks Completed",
            value: completed,
            growth: "+live",
            icon: CheckCircle2,
            color: "text-cyan-300",
        },
        {
            label: "Active Tasks",
            value: active,
            growth: "+live",
            icon: Clock3,
            color: "text-violet-300",
        },
        {
            label: "Completion Rate",
            value: `${completionRate}%`,
            growth: "+live",
            icon: TrendingUp,
            color: "text-pink-300",
        },
    ];

    // =====================================================
    // UI
    // =====================================================
    return (
        <section className="space-y-10 fade-in">

            {/* HERO */}
            <div className="flow-card p-8 md:p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-violet-500/5" />

                <div className="relative z-10 max-w-4xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm">
                        <Sparkles size={15} />
                        Intelligent Productivity Insights
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white">
                        Understand your workflow{" "}
                        <span className="heading-flow">at a deeper level.</span>
                    </h1>

                    <p className="text-lg text-white/55">
                        Visualize momentum and track real task performance from your backend.
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -5 }}
                            className="flow-card p-7"
                        >
                            <div className="flex items-center justify-between">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                                    <Icon size={24} className={stat.color} />
                                </div>

                                <span className="px-3 py-1.5 rounded-full bg-cyan-400/10 text-cyan-300 text-xs">
                                    {stat.growth}
                                </span>
                            </div>

                            <div className="mt-5">
                                <p className="text-white/45 text-sm">{stat.label}</p>
                                <h2 className="text-4xl font-bold mt-2">
                                    {stat.value}
                                </h2>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* VISUAL */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* CHART */}
                <div className="xl:col-span-3 flow-card p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />

                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-400/10 border border-cyan-400/10">
                                <Activity size={22} className="text-cyan-300" />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold">
                                    Weekly Momentum
                                </h3>
                                <p className="text-sm text-white/45">
                                    Real activity from your tasks
                                </p>
                            </div>
                        </div>

                        <div className="flex items-end gap-4 h-[260px]">
                            {safeChart.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: h * 10 }}
                                    transition={{ duration: 0.7, delay: i * 0.05 }}
                                    className="flex-1 rounded-t-[1.5rem] bg-gradient-to-t from-cyan-400/40 to-violet-500/50 border border-white/10"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* INSIGHTS */}
                <div className="xl:col-span-2 space-y-6">

                    <div className="flow-card p-7 space-y-4">
                        <div className="text-xs text-white/45 uppercase">
                            AI Insight
                        </div>

                        <h3 className="text-2xl font-semibold">
                            {bestTimeInsight}
                        </h3>

                        <p className="text-white/55">
                            Based on your task creation times.
                        </p>
                    </div>

                    <div className="flow-card p-7 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-white/45">
                                    Focus Rating
                                </p>
                                <h2 className="text-4xl font-bold mt-2">
                                    {completionRate}
                                </h2>
                            </div>

                            <BarChart3 size={34} className="text-cyan-300" />
                        </div>

                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default Analytics;