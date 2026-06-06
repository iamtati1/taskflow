import { useNavigate } from "react-router-dom";
import {
    Sparkles,
    BrainCircuit,
    Wand2,
    MessageSquare,
    ArrowRight,
} from "lucide-react";

// =====================================================
// SHARED CARD SYSTEM (aligned with entire app)
// =====================================================
function Card({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}>
            {children}
        </div>
    );
}

function AI() {
    const navigate = useNavigate();

    const cards = [
        {
            title: "AI Task Planner",
            desc: "Generate structured plans from your tasks instantly.",
            icon: BrainCircuit,
            route: "/ai/planner",
        },
        {
            title: "Smart Suggestions",
            desc: "Get productivity recommendations based on your habits.",
            icon: Sparkles,
            route: "/ai/suggestions",
        },
        {
            title: "Quick Assistant",
            desc: "Ask questions and get instant workflow help.",
            icon: MessageSquare,
            route: "/ai/assistant",
        },
        {
            title: "Automation Builder",
            desc: "Create intelligent task flows with AI assistance.",
            icon: Wand2,
            route: "/ai/automation",
        },
    ];

    return (
        <section className="space-y-10 max-w-[1400px] mx-auto">

            {/* =====================================================
                HEADER
            ===================================================== */}
            <Card className="relative overflow-hidden p-10">

                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-violet-500/5" />

                <div className="relative space-y-6 max-w-2xl">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/60 text-sm">
                        <Sparkles size={16} />
                        AI Workspace
                    </div>

                    <div className="space-y-3">

                        <h1 className="text-4xl font-bold text-white">
                            Your AI command center
                        </h1>

                        <p className="text-white/50 leading-relaxed">
                            Access intelligent tools to plan, optimize, and automate your workflow.
                        </p>

                    </div>

                </div>
            </Card>

            {/* =====================================================
                GRID
            ===================================================== */}
            <div className="
                grid grid-cols-1
                md:grid-cols-2
                xl:grid-cols-3
                gap-6
            ">

                {cards.map(({ title, desc, icon: Icon, route }) => (
                    <Card
                        key={title}
                        className="
                            cursor-pointer
                            group
                            transition-all
                            hover:-translate-y-1
                            hover:border-white/20
                        "
                        onClick={() => navigate(route)}
                    >

                        {/* ICON */}
                        <div className="
                            w-12 h-12
                            rounded-2xl
                            flex items-center justify-center
                            bg-white/5 border border-white/10
                            mb-4
                        ">
                            <Icon className="text-cyan-300" size={20} />
                        </div>

                        {/* CONTENT */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">
                                {title}
                            </h3>

                            <p className="text-sm text-white/50">
                                {desc}
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="
                            mt-4 flex items-center gap-2
                            text-sm text-cyan-300
                            opacity-0 group-hover:opacity-100
                            transition
                        ">
                            Open Tool
                            <ArrowRight size={16} />
                        </div>

                    </Card>
                ))}

            </div>
        </section>
    );
}

export default AI;