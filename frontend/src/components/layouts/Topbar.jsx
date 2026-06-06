import { useAuth } from "../../hooks/useAuth";

function Topbar() {
    const { currentUser } = useAuth();

    return (
        <header className="border-b border-white/10 bg-[#050816]/60 backdrop-blur-xl">

            <div className="flex items-center justify-between px-6 py-4">

                {/* LEFT */}
                <div>
                    <h1 className="text-xl font-semibold text-white">
                        Welcome back,{" "}
                        <span className="text-cyan-300">
                            {currentUser?.username || "Guest"}
                        </span>
                    </h1>

                    <p className="text-sm text-white/40">
                        Your workspace is ready
                    </p>
                </div>

                {/* RIGHT USER */}
                <div className="flex items-center gap-3">

                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-black font-semibold">
                        {currentUser?.username?.[0]?.toUpperCase() || "G"}
                    </div>

                </div>
            </div>
        </header>
    );
}

export default Topbar;