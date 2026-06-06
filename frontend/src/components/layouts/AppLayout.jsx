import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { motion } from "framer-motion";

function AppLayout() {
    const location = useLocation();

    // =====================================================
    // PAGE CONTEXT (for smarter UI later)
    // =====================================================
    const getPageTitle = () => {
        if (location.pathname.includes("tasks")) return "Tasks";
        if (location.pathname.includes("analytics")) return "Analytics";
        if (location.pathname.includes("dashboard")) return "Dashboard";
        return "Workspace";
    };

    return (
        <div className="relative min-h-screen bg-[#050816] text-white overflow-hidden">

            {/* =====================================================
                BACKGROUND LAYER (noise + grid + glow system)
            ===================================================== */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="app-grid" />
                <div className="app-noise" />

                <div className="absolute top-[-18rem] right-[-12rem] h-[40rem] w-[40rem] rounded-full bg-cyan-400/10 blur-[160px]" />
                <div className="absolute bottom-[-18rem] left-[-12rem] h-[44rem] w-[44rem] rounded-full bg-violet-500/10 blur-[180px]" />
            </div>

            {/* =====================================================
                APP SHELL
            ===================================================== */}
            <div className="relative z-10 flex min-h-screen">

                {/* SIDEBAR (sticky brain / navigation) */}
                <aside className="hidden lg:flex w-[280px] border-r border-white/10 bg-black/20 backdrop-blur-xl">
                    <div className="sticky top-0 h-screen w-full">
                        <Sidebar />
                    </div>
                </aside>

                {/* MAIN AREA */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* TOPBAR (context-aware header) */}
                    <div className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                        <Topbar title={getPageTitle()} />
                    </div>

                    {/* CONTENT */}
                    <main className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mx-auto w-full max-w-[1400px]">

                            {/* PAGE WRAPPER (Notion-style breathing space) */}
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-8"
                            >
                                <Outlet />
                            </motion.div>

                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}

export default AppLayout;