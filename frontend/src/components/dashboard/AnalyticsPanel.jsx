import {
    BarChart3,
    CheckCircle2,
    Layers3,
    TrendingUp,
} from "lucide-react";

function AnalyticsPanel({
    totalTasks = 0,
    completedTasks = 0,
    completionRate = 0,
}) {
    const remainingTasks = totalTasks - completedTasks;

    const status =
        completionRate >= 80
            ? { label: "Excellent", color: "cyan" }
            : completionRate >= 50
                ? { label: "On Track", color: "blue" }
                : { label: "Building Momentum", color: "violet" };

    const statusStyles = {
        cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
        blue: "text-blue-300 bg-blue-400/10 border-blue-400/20",
        violet: "text-violet-300 bg-violet-400/10 border-violet-400/20",
    };

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-7">

            {/* background glow */}
            <div className="absolute inset-0 pointer-events-none opacity-60">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-400/10 blur-[120px]" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 blur-[140px]" />
            </div>

            {/* HEADER (FIXED: single clean hierarchy) */}
            <div className="relative z-10 flex items-start justify-between gap-6 mb-8">

                <div className="space-y-2">

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                        <TrendingUp size={12} />
                        Performance
                    </div>

                    <h2 className="text-2xl md:text-3xl font-semibold text-white">
                        Productivity Overview
                    </h2>

                    <p className="text-sm text-white/45 max-w-md">
                        A snapshot of progress, completion trends, and task momentum.
                    </p>
                </div>

                <div className="hidden md:flex w-14 h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <BarChart3 size={22} className="text-cyan-300" />
                </div>

            </div>

            {/* KPI */}
            <div className="relative z-10 mb-8">

                <div className="flex items-end justify-between mb-4">

                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/35 mb-2">
                            Completion Rate
                        </p>

                        <div className="flex items-end gap-2">
                            <h3 className="text-6xl font-bold text-white tracking-tight">
                                {completionRate}
                            </h3>
                            <span className="text-2xl text-cyan-300 mb-1">%</span>
                        </div>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl border text-sm font-medium ${statusStyles[status.color]}`}>
                        {status.label}
                    </div>

                </div>

                <div className="h-4 w-full rounded-full border border-white/10 bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>

            </div>

            {/* METRICS */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">

                <MetricCard
                    icon={<Layers3 size={18} />}
                    label="Total Tasks"
                    value={totalTasks}
                    tone="neutral"
                />

                <MetricCard
                    icon={<CheckCircle2 size={18} />}
                    label="Completed"
                    value={completedTasks}
                    tone="cyan"
                />

                <MetricCard
                    icon={<TrendingUp size={18} />}
                    label="Remaining"
                    value={remainingTasks}
                    tone="violet"
                />

            </div>
        </section>
    );
}

/* =========================================================
   METRIC CARD (FIXED)
========================================================= */

function MetricCard({ icon, label, value, tone }) {
    const tones = {
        neutral: "text-white/70 border-white/10 bg-white/5",
        cyan: "text-cyan-300 border-cyan-400/15 bg-cyan-400/10",
        violet: "text-violet-300 border-violet-400/15 bg-violet-500/10",
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition">

            {/* subtle glow layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between mb-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${tones[tone]}`}>
                    {icon}
                </div>
            </div>

            <p className="text-sm text-white/45 relative z-10">{label}</p>

            <h3 className="text-3xl font-bold text-white relative z-10">
                {value}
            </h3>

        </div>
    );
}

export default AnalyticsPanel;