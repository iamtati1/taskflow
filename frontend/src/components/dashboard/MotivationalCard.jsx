import {
    Sparkles,
    Flame,
    MoonStar,
    CheckCircle2,
} from "lucide-react";

function MotivationalCard({ tasks = [] }) {
    const total = tasks.length;

    const completed = tasks.reduce(
        (count, t) => count + (t?.is_complete ? 1 : 0),
        0
    );

    const completionRate = total
        ? Math.round((completed / total) * 100)
        : 0;

    // =====================================================
    // STATE SYSTEM (CLEAN + READABLE)
    // =====================================================

    const state = (() => {
        if (total === 0) {
            return {
                message: "Create your first focus point.",
                subtext: "Every system starts with a single intentional step.",
                Icon: MoonStar,
                accent: "slate",
            };
        }

        if (completed === total) {
            return {
                message: "You completed everything today.",
                subtext: "Consistency is what turns effort into identity.",
                Icon: CheckCircle2,
                accent: "emerald",
            };
        }

        if (completed > 0) {
            return {
                message: "You’re building real momentum.",
                subtext: "Progress compounds through small repeated actions.",
                Icon: Flame,
                accent: "violet",
            };
        }

        return {
            message: "Start small. Build momentum.",
            subtext: "Consistency compounds into mastery.",
            Icon: Sparkles,
            accent: "cyan",
        };
    })();

    const { message, subtext, Icon, accent } = state;

    // =====================================================
    // STYLE MAPS
    // =====================================================

    const accentMap = {
        cyan: "from-cyan-400/10 to-blue-500/5",
        violet: "from-violet-500/10 to-pink-500/5",
        emerald: "from-emerald-400/10 to-cyan-500/5",
        slate: "from-white/5 to-cyan-400/5",
    };

    const barMap = {
        cyan: "from-cyan-400 via-blue-500 to-violet-500",
        violet: "from-violet-400 via-pink-500 to-violet-500",
        emerald: "from-emerald-400 via-cyan-400 to-emerald-500",
        slate: "from-white/20 via-white/10 to-cyan-400/20",
    };

    return (
        <div className="flow-card relative overflow-hidden p-6">

            {/* BACKGROUND */}
            <div className={`
                absolute inset-0 opacity-60 pointer-events-none
                bg-gradient-to-br ${accentMap[accent]}
                <div className="flow-card relative overflow-hidden p-6">
                // inside background
<div className="absolute inset-0 opacity-70 bg-gradient-to-br from-white/5 via-transparent to-cyan-400/5" />
            `} />

            <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-400/5 blur-[120px] pointer-events-none" />

            {/* CONTENT */}
            <div className="relative z-10 space-y-6">

                {/* HEADER */}
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-white/40">
                        Daily State
                    </h3>
                    <div className="space-y-3">

                        <div className="
                            inline-flex items-center gap-2
                            px-3 py-1.5
                            rounded-full
                            border border-white/10
                            bg-white/[0.03]
                            text-[11px] uppercase tracking-[0.2em]
                            text-white/40
                        ">
                            <Sparkles size={12} />
                            Daily Focus
                        </div>

                        <h3 className="text-xl md:text-2xl font-semibold text-white">
                            Stay in flow.
                        </h3>

                    </div>

                    <div className="
                        w-12 h-12 rounded-2xl
                        border border-white/10
                        bg-white/[0.04]
                        flex items-center justify-center
                    ">
                        <Icon size={20} className="text-cyan-300" />
                    </div>
                </div>

                {/* MESSAGE */}
                <div className="space-y-2">
                    <p className="text-lg font-semibold text-white leading-snug">
                        {message}
                    </p>

                    <p className="text-sm text-white/45 max-w-md">
                        {subtext}
                    </p>
                </div>

                {/* PROGRESS */}
                <div className="space-y-3">

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/40">Daily Progress</span>
                        <span className="text-cyan-300 font-medium">
                            {completionRate}%
                        </span>
                    </div>

                    <div className="
                        h-3 w-full rounded-full
                        bg-white/[0.03]
                        border border-white/10
                        overflow-hidden
                    ">
                        <div
                            className={`
                                h-full bg-gradient-to-r
                                ${barMap[accent]}
                                transition-all duration-700 ease-out
                            `}
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/35">
                    <span>
                        {completed} / {total} completed
                    </span>

                    <span className="text-cyan-300">
                        {completionRate}% flow state
                    </span>
                </div>

                <div className="
                    flex items-center justify-between
                    pt-3 border-t border-white/10
                ">
                    <div className="text-xs text-white/35">
                        {total === 0
                            ? "No tasks created yet"
                            : `${completed} of ${total} completed`}
                    </div>

                    <div className="text-xs text-white/25">
                        Focus • Flow • Execute
                    </div>
                </div>

            </div>
        </div>
    );
}

export default MotivationalCard;