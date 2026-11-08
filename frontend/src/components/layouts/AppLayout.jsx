import { useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import ToastViewport from "../notifications/ToastViewport";
import AmbientBackground from "../ui/AmbientBackground";
import useUISettings from "../../hooks/useUISettings";
import { EASE_OUT } from "../../utils/motion";

// =====================================================
// ROUTE CONFIG
// =====================================================
const PAGE_TITLES = {
    "/dashboard": "Dashboard",
    "/tasks": "Tasks",
    "/analytics": "Analytics",
    "/settings": "Settings",
};

function AppLayout() {
    const location = useLocation();
    // The current page, kept as-is while it animates out
    const outlet = useOutlet();

    const ui = useUISettings() || {};
    const quickSettings = ui.quickSettings || { "Focus Mode": false };

    const pageTitle = PAGE_TITLES[location.pathname] || "Workspace";

    // The browser tab names the page (and screen readers announce it)
    useEffect(() => {
        document.title = `${pageTitle} · TaskFlow`;
    }, [pageTitle]);

    return (
        <div className="relative min-h-screen overflow-x-clip bg-base text-white">

            {/* SKIP LINK (first stop for keyboard users) */}
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-950"
            >
                Skip to content
            </a>

            {/* BACKGROUND: the theme's ambient light */}
            <AmbientBackground />

            {/* APP SHELL */}
            <div className="relative flex min-h-screen overflow-x-clip">

                {/* SIDEBAR (from lg) */}
                <aside
                    className={`hidden w-[264px] shrink-0 border-r border-white/[0.07] bg-raised/45 backdrop-blur-xl transition-opacity duration-300 lg:flex
                        ${quickSettings["Focus Mode"] ? "opacity-60 hover:opacity-100" : "opacity-100"}`}
                >
                    <div className="sticky top-0 h-screen w-full">
                        <Sidebar />
                    </div>
                </aside>

                {/* MAIN */}
                <div className="flex min-w-0 flex-1 flex-col">

                    <div className="sticky top-0 z-20 border-b border-white/[0.07] bg-base/70 backdrop-blur-xl">
                        <Topbar title={pageTitle} />
                    </div>

                    <main
                        id="main"
                        tabIndex={-1}
                        className="flex-1 px-4 pb-28 pt-6 outline-none sm:px-6 lg:px-10 lg:pb-12 lg:pt-8"
                    >
                        <div className="mx-auto w-full max-w-[1280px]">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={location.pathname}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
                                    exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                                >
                                    {outlet}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </main>
                </div>
            </div>

            <MobileNav />
            <ToastViewport />
        </div>
    );
}

export default AppLayout;
