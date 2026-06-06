import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#050816] text-white">

            {/* =====================================================
                GLOBAL BACKGROUND
            ===================================================== */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">

                {/* GRID */}
                <div className="app-grid" />

                {/* NOISE */}
                <div className="app-noise" />

                {/* CYAN GLOW */}
                <div
                    className="
                        absolute
                        top-[-15rem]
                        right-[-10rem]
                        h-[40rem]
                        w-[40rem]
                        rounded-full
                        bg-cyan-400/10
                        blur-[160px]
                    "
                />

                {/* VIOLET GLOW */}
                <div
                    className="
                        absolute
                        bottom-[-15rem]
                        left-[-10rem]
                        h-[42rem]
                        w-[42rem]
                        rounded-full
                        bg-violet-500/10
                        blur-[180px]
                    "
                />

            </div>

            {/* =====================================================
                APPLICATION
            ===================================================== */}
            <div className="relative z-10 flex min-h-screen">

                {/* =====================================================
                    SIDEBAR
                ===================================================== */}
                <aside
                    className="
                        hidden
                        lg:flex
                        lg:w-[280px]
                        xl:w-[300px]
                        shrink-0

                        border-r
                        border-white/10

                        bg-black/20
                        backdrop-blur-2xl
                    "
                >
                    <Sidebar />
                </aside>

                {/* =====================================================
                    CONTENT
                ===================================================== */}
                <div className="flex min-w-0 flex-1 flex-col">

                    {/* TOPBAR */}
                    <div
                        className="
                            sticky
                            top-0
                            z-50

                            border-b
                            border-white/10

                            bg-[#050816]/70
                            backdrop-blur-2xl
                        "
                    >
                        <Topbar />
                    </div>

                    {/* PAGE */}
                    <main
                        className="
                            flex-1
                            overflow-y-auto

                            px-6
                            py-8

                            md:px-8
                            xl:px-10
                        "
                    >
                        <div className="mx-auto w-full max-w-[1600px]">
                            {children}
                        </div>
                    </main>

                </div>

            </div>
        </div>
    );
}

export default MainLayout;