import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import { motion } from "framer-motion";
import useUISettings from "../../hooks/useUISettings";

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

    const ui = useUISettings() || {};

    const theme = ui.theme || "midnight";
    const quickSettings = ui.quickSettings || { "Focus Mode": false };
    // =====================================================
    // PAGE TITLE RESOLUTION
    // =====================================================
    const getPageTitle = () => {
        const path = location.pathname;

        if (PAGE_TITLES[path]) return PAGE_TITLES[path];

        if (path.includes("tasks")) return "Tasks";
        if (path.includes("analytics")) return "Analytics";
        if (path.includes("dashboard")) return "Dashboard";

        return "Workspace";
    };

    // =====================================================
    // THEME CLASS SYSTEM
    // =====================================================
    const themeClass = "bg-[#050816]";

    return (
        <div className={`relative min-h-screen text-white overflow-hidden transition-colors duration-300 ${themeClass}`}>

            {/* BACKGROUND SYSTEM */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="app-grid" />
                <div className="app-noise" />

                <div className="absolute top-[-18rem] right-[-12rem] h-[40rem] w-[40rem] rounded-full bg-blue-500/10 blur-[160px]" />
                <div className="absolute bottom-[-18rem] left-[-12rem] h-[44rem] w-[44rem] rounded-full bg-indigo-500/10 blur-[180px]" />
            </div>

            {/* APP SHELL */}
            <div className="relative min-h-screen text-white overflow-hidden flex">

                {/* SIDEBAR */}
                <aside
                    className={`hidden lg:flex w-[280px] border-r border-white/10 bg-black/20 backdrop-blur-xl transition-opacity
                        ${quickSettings["Focus Mode"] ? "opacity-60" : "opacity-100"}`}
                >
                    <div className="sticky top-0 h-screen w-full">
                        <Sidebar />
                    </div>
                </aside>

                {/* MAIN */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* TOPBAR */}
                    <div className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
                        <Topbar title={getPageTitle()} />
                    </div>

                    {/* CONTENT */}
                    <main className="flex-1 overflow-y-auto px-6 pt-8 pb-28 lg:pb-8">
                        <div className="mx-auto w-full max-w-[1400px]">

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

            <MobileNav />
        </div>
    );
}

export default AppLayout;