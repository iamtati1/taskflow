import {
    Sparkles,
    CheckCircle2,
    Clock3,
    BrainCircuit,
    ArrowRight,
    Activity,
    TrendingUp,
    Layers3,
    Flame,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import useTasks from "../hooks/useTasks";

function DashboardStats() {
    const navigate = useNavigate();

    // =====================================================
    // 🧠 LIVE SYSTEM STATE
    // =====================================================
    const {
        tasks,
        activeTasks,
        completedTasks,
    } = useTasks();

    const total = tasks.length;
    const active = activeTasks.length;
    const completed = completedTasks.length;

    const completionRate =
        total === 0 ? 0 : Math.round((completed / total) * 100);

    // =====================================================
    // 🧠 SYSTEM INTELLIGENCE LAYER
    // =====================================================
    const systemState =
        total === 0
            ? {
                label: "System Idle",
                sub: "No tasks yet — start building momentum",
                color: "text-white/40",
            }
            : completionRate >= 80
                ? {
                    label: "Flow State",
                    sub: "High execution rhythm detected",
                    color: "text-cyan-300",
                }
                : completionRate >= 50
                    ? {
                        label: "Stable Momentum",
                        sub: "Consistent progress is forming",
                        color: "text-violet-300",
                    }
                    : {
                        label: "Building Structure",
                        sub: "Early execution phase",
                        color: "text-amber-300",
                    };

    return (
        <section className="space-y-10 fade-in">

            {/* =====================================================
                HERO (LIVE SYSTEM HERO)
            ===================================================== */}
            <div className="flow-card p-8 md:p-12 relative overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-violet-500/5" />

                <div className="relative z-10 max-w-4xl space-y-6">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/70 text-sm">
                        <Sparkles size={16} />
                        Live Productivity System
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        Your workflow is
                        <span className={`block ${systemState.color}`}>
                            {systemState.label}
                        </span>
                    </h1>

                    <p className="text-white/60 max-w-2xl">
                        {systemState.sub}
                    </p>

                    {/* =====================================================
                        LIVE METRICS STRIP
                    ===================================================== */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">

                        <Metric icon={Layers3} label="Total" value={total} />
                        <Metric icon={Activity} label="Active" value={active} />
                        <Metric icon={CheckCircle2} label="Done" value={completed} />
                        <Metric icon={TrendingUp} label="Rate" value={`${completionRate}%`} />

                    </div>

                    {/* CTA */}
                    <div className="flex gap-4 pt-4">
                        <button className="btn-flow" onClick={() => navigate("/tasks")}>
                            Open Workspace
                            <ArrowRight size={18} />
                        </button>

                        <button className="btn-secondary" onClick={() => navigate("/analytics")}>
                            Deep Analytics
                        </button>
                    </div>

                </div>
            </div>

            {/* =====================================================
                LIVE INSIGHT GRID
            ===================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Insight
                    title="Execution Pressure"
                    value={`${active} active`}
                    desc="Current cognitive load"
                    icon={Clock3}
                />

                <Insight
                    title="Momentum"
                    value={`${completionRate}%`}
                    desc="System completion velocity"
                    icon={Flame}
                />

                <Insight
                    title="System Health"
                    value={total > 0 ? "Active" : "Empty"}
                    desc="Overall workflow state"
                    icon={BrainCircuit}
                />

            </div>

        </section>
    );
}

/* =========================================================
   COMPONENTS
========================================================= */

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <Icon size={16} className="text-white/60" />
            <p className="text-xs text-white/40 mt-2">{label}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
        </div>
    );
}

function Insight({ title, value, desc, icon: Icon }) {
    return (
        <div className="flow-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                <Icon size={14} />
                {title}
            </div>

            <div className="text-2xl font-bold text-white">
                {value}
            </div>

            <p className="text-sm text-white/50">
                {desc}
            </p>
        </div>
    );
}

export default DashboardStats;