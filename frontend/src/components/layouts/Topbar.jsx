import { useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function Topbar() {
    const { currentUser } = useAuth();
    const location = useLocation();

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good morning"
            : hour < 18
                ? "Good afternoon"
                : "Good evening";

    const pageMap = {
        "/dashboard": {
            title: "Dashboard",
            subtitle: "Focus on what matters today",
        },
        "/tasks": {
            title: "Tasks",
            subtitle: "Manage your workflow with clarity",
        },
        "/analytics": {
            title: "Analytics",
            subtitle: "Track your progress and momentum",
        },
        "/settings": {
            title: "Settings",
            subtitle: "Customize your workspace",
        },
    };

    const currentPage =
        pageMap[location.pathname] || {
            title: "FlowState",
            subtitle: "Your personal productivity system",
        };

    return (
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/60 backdrop-blur-xl">
            <div className="flex items-center justify-between px-8 py-5">

                {/* LEFT */}
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
                        {greeting}
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-white">
                        {currentPage.title}
                    </h1>

                    <p className="mt-1 text-sm text-white/50">
                        {currentPage.subtitle}
                    </p>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                    <div
                        className="
                            hidden
                            md:flex
                            items-center
                            gap-2
                            rounded-2xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            px-4
                            py-2
                        "
                    >
                        <CalendarDays size={16} />
                        <span className="text-sm text-white/70">
                            {new Date().toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>

                    <div
                        className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-white/10
                            bg-gradient-to-br
                            from-cyan-400
                            to-violet-500
                            text-black
                            font-semibold
                            shadow-lg
                            shadow-cyan-500/20
                        "
                    >
                        {currentUser?.username?.[0]?.toUpperCase() || "G"}
                    </div>

                </div>
            </div>
        </header>
    );
}

export default Topbar;