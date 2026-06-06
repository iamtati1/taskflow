import {
    BarChart3,
    CheckCircle2,
    Layers3,
    TrendingUp,
    Flame,
    Clock3,
    Target,
} from "lucide-react";

function AnalyticsPanel({ tasks = [] }) {

    // =====================================================
    // CORE ENGINE (derived from CRUD)
    // =====================================================
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.is_complete).length;
    const activeTasks = totalTasks - completedTasks;

    const completionRate = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    // =====================================================
    // PRODUCTIVITY SIGNALS (REAL ENGINE LOGIC)
    // =====================================================

    // 1. Momentum (recent activity bias)
    const recentTasks = tasks.filter(t => {
        if (!t.created_at) return false;
        const created = new Date(t.created_at);
        const now = new Date();
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays <= 3;
    });

    const momentumScore = Math.min(100, recentTasks.length * 12);

    // 2. Consistency (completion ratio stability signal)
    const consistencyScore =
        totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100);

    // 3. Focus Pressure (active workload signal)
    const pressureScore = Math.min(100, activeTasks * 10);

    // =====================================================
    // INSIGHT ENGINE (this is what makes it “alive”)
    // =====================================================

    const insight =
        completionRate >= 80
            ? {
                label: "High Execution Flow",
                subtext: "You are consistently converting intention into action.",
                tone: "cyan",
                icon: Flame,
            }
            : completionRate >= 50
                ? {
                    label: "Steady Progress",
                    subtext: "Your system is stable — small improvements will compound.",
                    tone: "blue",
                    icon: TrendingUp,
                }
                : {
                    label: "Building Momentum",
                    subtext: "Focus on completing fewer tasks with higher consistency.",
                    tone: "violet",
                    icon: Target,
                };

    const tones = {
        cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
        blue: "text-blue-300 bg-blue-400/10 border-blue-400/20",
        violet: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    };

    const InsightIcon = insight.icon;

    // =====================================================
    // UI
    // =====================================================
    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-7">

            {/* glow layer */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-400/10 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 blur-[140px]" />
            </div>

            {/* HEADER */}
            <div className="relative z-10 flex items-start justify-between mb-8">

                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                        <BarChart3 size={12} />
                        Task Intelligence
                    </div>

                    <h2 className="text-2xl md:text-3xl font-semibold text-white mt-3">
                        Productivity Engine
                    </h2>

                    <p className="text-sm text-white/45 max-w-md mt-2">
                        Real-time insights derived directly from your task system.
                    </p>
                </div>

                <div className="hidden md:flex w-14 h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <InsightIcon size={22} className="text-cyan-300" />
                </div>

            </div>

            {/* MAIN INSIGHT CARD */}
            <div className={`relative z-10 mb-6 p-5 rounded-2xl border ${tones[insight.tone]}`}>
                <h3 className="text-lg font-semibold text-white">
                    {insight.label}
                </h3>
                <p className="text-sm text-white/70 mt-1">
                    {insight.subtext}
                </p>
            </div>

            {/* KPI GRID */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">

                <Metric
                    icon={<CheckCircle2 size={18} />}
                    label="Completion Rate"
                    value={`${completionRate}%`}
                />

                <Metric
                    icon={<Clock3 size={18} />}
                    label="Active Workload"
                    value={activeTasks}
                />

                <Metric
                    icon={<Layers3 size={18} />}
                    label="Total Tasks"
                    value={totalTasks}
                />

            </div>

            {/* MINI SIGNAL STRIP (NEW UX LAYER) */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2 text-xs text-white/50">

                <Signal label="Momentum" value={momentumScore} />
                <Signal label="Consistency" value={consistencyScore} />
                <Signal label="Pressure" value={pressureScore} />

            </div>

        </section>
    );
}

/* =========================================================
   METRIC COMPONENT
========================================================= */

function Metric({ icon, label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between mb-3 text-white/60">
                {icon}
            </div>
            <p className="text-sm text-white/50">{label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
    );
}

/* =========================================================
   SIGNAL COMPONENT
========================================================= */

function Signal({ label, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p>{label}</p>
            <div className="h-1.5 mt-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

export default AnalyticsPanel;