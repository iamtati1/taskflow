import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
    return (
        <div className="relative min-h-screen bg-[#050816] text-white">

            {/* BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="app-grid" />
                <div className="app-noise" />

                <div className="absolute top-[-18rem] right-[-12rem] h-[40rem] w-[40rem] rounded-full bg-cyan-400/10 blur-[160px]" />
                <div className="absolute bottom-[-18rem] left-[-12rem] h-[44rem] w-[44rem] rounded-full bg-violet-500/10 blur-[180px]" />
            </div>

            {/* LAYOUT */}
            <div className="relative z-10 flex min-h-screen">

                {/* SIDEBAR */}
                <aside className="hidden lg:block w-[280px] border-r border-white/10 bg-black/20 backdrop-blur-xl">
                    <Sidebar />
                </aside>

                {/* MAIN */}
                <div className="flex-1 flex flex-col min-w-0">

                    {/* TOPBAR */}
                    <Topbar />

                    {/* CONTENT */}
                    <main className="flex-1 overflow-y-auto px-6 py-8">
                        <div className="mx-auto w-full max-w-[1400px]">
                            <Outlet />
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}

export default AppLayout;