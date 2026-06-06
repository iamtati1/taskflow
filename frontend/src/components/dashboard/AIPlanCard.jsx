import {
    Sparkles,
    BrainCircuit,
    ArrowRight,
    Wand2,
    CheckCircle2,
} from "lucide-react";

function AIPlanCard({ task }) {
    const steps = [
        "Break the task into focused milestones.",
        "Prioritize the highest impact action first.",
        "Schedule uninterrupted deep-work time.",
        "Reduce friction and distractions before starting.",
        "Review progress and refine execution afterward.",
    ];

    // =====================================================
    // EMPTY STATE
    // =====================================================

    if (!task) {
        return (
            <div className="flow-card relative overflow-hidden p-6 md:p-7">

                {/* background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-violet-500/5" />

                <div className="relative z-10 flex flex-col items-center text-center py-10 space-y-5">

                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                        <BrainCircuit size={34} className="text-cyan-300" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                        <Sparkles size={12} />
                        AI Productivity Assistant
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                        Generate an execution strategy
                    </h2>

                    <p className="text-sm text-white/50 max-w-sm leading-relaxed">
                        Select a task to receive an intelligent execution plan for focus and clarity.
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN VIEW
    // =====================================================

    return (
        <div className="flow-card relative overflow-hidden p-6 md:p-7">

            {/* background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-400/5" />

            <div className="relative z-10 space-y-7">

                {/* HEADER */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                    AI Reasoning
                </div>
                <div className="flex items-start justify-between gap-5">

                    <div>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40 mb-4">
                            <Sparkles size={12} />
                            AI Execution Engine
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                            Strategic Execution Plan
                        </h2>

                        <p className="mt-2 text-sm text-white/50">
                            AI-generated workflow guidance for better execution.
                        </p>

                    </div>

                    <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-3xl border border-white/10 bg-white/5">
                        <Wand2 size={28} className="text-violet-300" />
                    </div>

                </div>

                {/* TASK */}
                <div className="rounded-3xl border border-cyan-400/10 bg-white/5 p-5">

                    <p className="text-xs uppercase tracking-[0.18em] text-white/35 mb-2">
                        Selected Task
                    </p>

                    <h3 className="text-xl font-semibold text-cyan-200">
                        {task.title}
                    </h3>

                </div>

                {/* STEPS */}
                <div className="group flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">

                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="group flex items-start gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 font-semibold">
                                {i + 1}
                            </div>

                            <p className="flex-1 text-sm text-white/80">
                                {step}
                            </p>

                            <ArrowRight
                                size={16}
                                className="text-cyan-300 opacity-0 group-hover:opacity-100 transition"
                            />
                        </div>
                    ))}

                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">

                    <div className="flex items-center gap-2 text-sm text-white/50">
                        <CheckCircle2 size={14} className="text-cyan-300" />
                        Optimized for deep work
                    </div>

                    <div className="text-xs text-white/30">
                        AI Assisted Planning
                    </div>

                </div>

            </div>
        </div>
    );
}

export default AIPlanCard;