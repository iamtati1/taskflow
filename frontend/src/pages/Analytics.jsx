import { motion } from "framer-motion";
import { useMemo } from "react";
import useTasks from "../hooks/useTasks";

import {
    BarChart3,
    TrendingUp,
    Activity,
    CheckCircle2,
    Sparkles,
    Clock3,
} from "lucide-react";

// =====================================================
// SHARED CARD SYSTEM (same as entire app)
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function Analytics() {
    const { tasks = [] } = useTasks();

    // =====================================================
    // DERIVED ENGINE
    // =====================================================
    const metrics = useMemo(() => {
        const total = tasks.length;

        let completed = 0;
        let active = 0;

        const dailyMap = {};
        let morningCount = 0;

        for (const t of tasks) {
            if (t.is_complete) completed++;
            else active++;

            if (t.created_at) {
                const dateKey = new Date(t.created_at).toDateString();
                dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;

                const hour = new Date(t.created_at).getHours();
                if (hour >= 8 && hour <= 11) morningCount++;
            }
        }

        const completionRate =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        const chartData = Object.values(dailyMap).slice(-7);

        return {
            total,
            completed,
            active,
            completionRate,
            chartData,
            morningCount,
        };
    }, [tasks]);

    // =====================================================
    // INSIGHTS
    // =====================================================
    const insights = useMemo(() => {
        const { completionRate, morningCount, total } = metrics;

        const bestTime =
            total === 0
                ? "Start creating tasks to build patterns."
                : morningCount > total / 2
                    ? "You perform best in morning sessions (8–11 AM)."
                    : "Your productivity is distributed across the day.";

        const reflection =
            completionRate >= 70
                ? {
                    title: "Excellent momentum",
                    desc: "You are consistently finishing the work you commit to.",
                }
                : completionRate >= 40
                    ? {
                        title: "Steady progress",
                        desc: "You're building a healthy rhythm of execution.",
                    }
                    : {
                        title: "Building consistency",
                        desc: "Small wins compound. Keep focusing on execution.",
                    };

        return { bestTime, reflection };
    }, [metrics]);

    const stats = [
        {
            label: "Completed",
            value: metrics.completed,
            icon: CheckCircle2,
            color: "text-cyan-300",
        },
        {
            label: "Active",
            value: metrics.active,
            icon: Clock3,
            color: "text-violet-300",
        },
        {
            label: "Completion",
            value: `${metrics.completionRate}%`,
            icon: TrendingUp,
            color: "text-pink-300",
        },
        {
            label: "Total",
            value: metrics.total,
            icon: Activity,
            color: "text-orange-300",
        },
    ];

    const hasData = metrics.total > 0;
    const safeChart = metrics.chartData.length ? metrics.chartData : [];

    return (
        <section className="space-y-10">

            {/* =====================================================
                HERO
            ===================================================== */}
            <Card className="relative overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />

                <div className="relative space-y-4 max-w-4xl">

                    <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles size={16} />
                        Reflection Center
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Understand how your
                        <span className="block text-white/70">
                            effort becomes progress.
                        </span>
                    </h1>

                    <p className="text-white/55">
                        Reflection transforms activity into awareness. Build patterns, refine execution, and grow consistency.
                    </p>

                </div>
            </Card>

            {/* =====================================================
                STATS
            ===================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {stats.map((stat, i) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                        >
                            <Card className="h-full">

                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5">
                                    <Icon size={20} className={stat.color} />
                                </div>

                                <p className="text-white/45 text-sm mt-4">
                                    {stat.label}
                                </p>

                                <h2 className="text-3xl font-bold mt-2 text-white">
                                    {stat.value}
                                </h2>

                            </Card>
                        </motion.div>
                    );
                })}

            </div>

            {/* =====================================================
                MAIN GRID
            ===================================================== */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* CHART */}
                <Card className="xl:col-span-3 space-y-6">

                    <div className="flex items-center gap-3">
                        <Activity size={20} className="text-cyan-300" />
                        <div>
                            <h3 className="text-xl font-semibold text-white">
                                Execution Momentum
                            </h3>
                            <p className="text-sm text-white/45">
                                Real activity from your tasks
                            </p>
                        </div>
                    </div>

                    {!hasData ? (
                        <div className="h-[260px] flex items-center justify-center text-white/40">
                            No activity yet. Start completing tasks to see momentum.
                        </div>
                    ) : (
                        <div className="flex items-end gap-4 h-[260px]">
                            {safeChart.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: h * 10 }}
                                    transition={{ duration: 0.6, delay: i * 0.05 }}
                                    className="flex-1 rounded-t-2xl bg-gradient-to-t from-cyan-400/40 to-violet-500/50 border border-white/10"
                                />
                            ))}
                        </div>
                    )}

                </Card>

                {/* INSIGHTS */}
                <div className="xl:col-span-2 space-y-6">

                    <Card className="space-y-3">
                        <div className="text-xs text-white/45 uppercase">
                            Work Pattern
                        </div>

                        <h3 className="text-xl font-semibold text-white">
                            {insights.bestTime}
                        </h3>
                    </Card>

                    <Card className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-white/45 uppercase">
                            <Sparkles size={14} className="text-cyan-300" />
                            Reflection
                        </div>

                        <h3 className="text-xl font-semibold text-white">
                            {insights.reflection.title}
                        </h3>

                        <p className="text-white/55">
                            {insights.reflection.desc}
                        </p>
                    </Card>

                    <Card className="space-y-4">

                        <div className="flex items-center justify-between">

                            <div>
                                <p className="text-sm text-white/45">
                                    Focus Rating
                                </p>

                                <h2 className="text-3xl font-bold mt-2 text-white">
                                    {metrics.completionRate}%
                                </h2>
                            </div>

                            <BarChart3 size={30} className="text-cyan-300" />
                        </div>

                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                                style={{ width: `${metrics.completionRate}%` }}
                            />
                        </div>

                    </Card>

                </div>
            </div>
        </section>
    );
}

export default Analytics;