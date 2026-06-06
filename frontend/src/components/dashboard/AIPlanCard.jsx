import {
    Sparkles,
    BrainCircuit,
    ArrowRight,
    Wand2,
    CheckCircle2,
} from "lucide-react";

function AIPlanCard({ task }) {

    // =====================================================
    // ENGINE: CONTEXT GENERATION LAYER
    // =====================================================

    const generateSteps = (task) => {
        if (!task) return [];

        const baseSteps = [
            "Break the task into clear actionable steps.",
            "Identify the highest-impact first action.",
            "Remove distractions before starting execution.",
            "Work in a focused deep-work block.",
            "Review output and refine if needed.",
        ];

        // lightweight intelligence layer
        if (task.priority === "high") {
            baseSteps.unshift("Treat this as a high-priority execution block.");
        }

        if (task.is_complete) {
            return ["This task is already completed. Reflect on execution quality."];
        }

        return baseSteps;
    };

    const steps = generateSteps(task);

    // =====================================================
    // EMPTY STATE
    // =====================================================

    if (!task) {
        return (
            <div className="flow-card relative overflow-hidden p-6 md:p-7">

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-violet-500/5" />

                <div className="relative z-10 flex flex-col items-center text-center py-10 space-y-5">

                    <div className="w-20 h-20 flex items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                        <BrainCircuit size={34} className="text-cyan-300" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                        <Sparkles size={12} />
                        AI Execution Engine
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                        Select a task to generate a plan
                    </h2>

                    <p className="text-sm text-white/50 max-w-sm">
                        Your AI assistant will generate a structured execution strategy.
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

            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-cyan-400/5" />

            <div className="relative z-10 space-y-6">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-5">

                    <div className="space-y-2">

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/40">
                            <Sparkles size={12} />
                            AI Execution Engine
                        </div>

                        <h2 className="text-2xl font-bold text-white">
                            Execution Strategy
                        </h2>

                        <p className="text-sm text-white/50">
                            AI-generated guidance for better focus and clarity.
                        </p>

                    </div>

                    <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-2xl border border-white/10 bg-white/5">
                        <Wand2 size={24} className="text-violet-300" />
                    </div>

                </div>

                {/* TASK */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-white/40">
                        Selected Task
                    </p>

                    <h3 className="text-lg font-semibold text-cyan-200 mt-1">
                        {task.title}
                    </h3>
                </div>

                {/* STEPS */}
                <div className="space-y-3">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 text-sm font-medium">
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