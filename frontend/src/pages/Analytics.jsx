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

        for (const t of tasks) {
            if (t.is_complete) completed++;
            else active++;
        }

        const completionRate =
            total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
            total,
            completed,
            active,
            completionRate,
        };
    }, [tasks]);

    // =====================================================
    // INSIGHTS
    // =====================================================
    const insights = useMemo(() => {
        const { completionRate } = metrics;

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

        return { reflection };
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
            {/* Insights from completion data (the only activity the database stores) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
        </section>
    );
}

export default Analytics;