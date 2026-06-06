import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckCircle2, Clock3, BrainCircuit, ArrowRight } from "lucide-react";

function Dashboard() {
    const navigate = useNavigate();
    const features = [

        {
            icon: CheckCircle2,
            title: "Smart Task Management",
            desc: "Structured workflows with clarity.",
        },
        {
            icon: Clock3,
            title: "Focused Execution",
            desc: "Reduce noise and improve momentum.",
        },
        {
            icon: BrainCircuit,
            title: "AI Planning",
            desc: "Intelligent workflow guidance.",
        },
    ];
    return (
        <motion.section className="space-y-12 p-6">

            {/* HERO */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
                <div className="flex items-center gap-2 text-white/70">
                    <Sparkles size={16} />
                    Flow Productivity System
                </div>

                <h1 className="text-3xl font-bold text-white mt-4">
                    Welcome to your workspace
                </h1>

                <p className="text-white/60 mt-2">
                    A unified system for tasks, focus, and execution.
                </p>

                <button
                    onClick={() => navigate("/tasks")}
                    className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl border border-cyan-400/30 hover:bg-cyan-400/10"
                >
                    Open Tasks
                    <ArrowRight size={16} />
                </button>
            </div>

            {/* FEATURES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map((f) => {
                    const Icon = f.icon;
                    return (
                        <div
                            key={f.title}
                            className="rounded-2xl border border-white/10 bg-white/5 p-6"
                        >
                            <Icon className="text-white/70 mb-3" />
                            <h3 className="text-white font-semibold">{f.title}</h3>
                            <p className="text-white/50 text-sm">{f.desc}</p>
                        </div>
                    );
                })}
            </div>

        </motion.section>
    );
}

export default Dashboard;