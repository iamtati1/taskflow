import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    CheckCircle2,
    Clock3,
    BrainCircuit,
    ArrowRight,
    CalendarDays,
    Zap,
    Target,
} from "lucide-react";

import useTasks from "../hooks/useTasks";

function Card({ children, className = "" }) {
    return (
        <div
            className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all ${className}`}
        >
            {children}
        </div>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const { tasks = [] } = useTasks();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_complete).length;
    const active = total - completed;

    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const upcoming = tasks
        .filter((t) => t.due_date && !t.is_complete)
        .slice(0, 3);

    const streak = 4;

    const momentum =
        progress >= 70
            ? "You are in strong execution mode."
            : progress >= 40
                ? "You are building steady momentum."
                : "You are still establishing rhythm.";

    const focusSuggestion =
        active > completed
            ? "Focus on reducing active load before adding more tasks."
            : "You are balancing completion well.";

    const stats = [
        { icon: CheckCircle2, value: completed, label: "Completed" },
        { icon: Target, value: active, label: "Active" },
        { icon: Zap, value: `${progress}%`, label: "Progress" },
        { icon: Clock3, value: streak, label: "Streak" },
    ];

    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
        >
            {/* HERO */}
            <Card className="relative overflow-hidden">

                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

                <div className="relative space-y-5 max-w-3xl">

                    <div className="flex items-center gap-2 text-cyan-300">
                        <Sparkles size={16} />
                        Command Center
                    </div>

                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Your work, structured
                        <span className="block text-white/60">
                            around clarity and momentum.
                        </span>
                    </h1>

                    <p className="text-white/55">
                        {momentum}
                    </p>

                    <button
                        onClick={() => navigate("/tasks")}
                        className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-white transition hover:bg-cyan-400/15"
                    >
                        Open Tasks
                        <ArrowRight size={16} />
                    </button>

                </div>
            </Card>

            {/* STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <Card key={stat.label}>
                            <Icon size={18} className="text-cyan-300" />

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

            {/* INSIGHT + UPCOMING */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                <Card>
                    <div className="flex items-center gap-2 text-violet-300">
                        <BrainCircuit size={18} />
                        System Insight
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white">
                        {focusSuggestion}
                    </h3>

                    <p className="mt-2 text-white/60 leading-relaxed">
                        Focus improves when task load is intentional rather than reactive.
                    </p>
                </Card>

                <Card>
                    <div className="flex items-center gap-2 text-cyan-300">
                        <CalendarDays size={18} />
                        Upcoming
                    </div>

                    <div className="mt-4 space-y-3">
                        {upcoming.length === 0 ? (
                            <p className="text-white/50 text-sm">
                                No upcoming tasks scheduled.
                            </p>
                        ) : (
                            upcoming.map((task) => (
                                <div
                                    key={task.task_id}
                                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                                >
                                    <p className="text-white/80">
                                        {task.title}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* QUICK ACTIONS */}
            <Card>
                <h3 className="text-lg font-semibold text-white">
                    Quick Actions
                </h3>

                <div className="mt-5 flex flex-wrap gap-3">

                    <button
                        onClick={() => navigate("/tasks")}
                        className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-white transition hover:bg-cyan-400/15"
                    >
                        View Tasks
                    </button>

                    <button
                        onClick={() => navigate("/analytics")}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-white/80 transition hover:bg-white/[0.05]"
                    >
                        View Analytics
                    </button>

                </div>
            </Card>
        </motion.section>
    );
}

export default Dashboard;