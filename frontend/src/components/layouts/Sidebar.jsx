import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Sparkles,
    Home,
    CheckSquare,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

// Shared with MobileNav so both navigations list the same pages
export const links = [
    {
        to: "/dashboard",
        label: "Dashboard",
        icon: Home,
    },
    {
        to: "/tasks",
        label: "Tasks",
        icon: CheckSquare,
    },
    {
        to: "/analytics",
        label: "Analytics",
        icon: BarChart3,
    },
    {
        to: "/settings",
        label: "Settings",
        icon: Settings,
    },
];

function Sidebar() {
    const { currentUser, signOut } = useAuth();
    const [signingOut, setSigningOut] = useState(false);

    // Signing out clears the user, so ProtectedRoute sends the page to /auth
    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut();
        } finally {
            setSigningOut(false);
        }
    };

    return (
        <div className="flex h-full flex-col px-5 py-6">

            {/* BRAND */}
            <div className="pb-8 border-b border-white/10">

                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-xl
                            border
                            border-cyan-400/20
                            bg-cyan-400/10
                        "
                    >
                        <Sparkles
                            size={18}
                            className="text-cyan-300"
                        />
                    </div>

                    <div>
                        <h1 className="font-semibold text-white">
                            TaskFlow
                        </h1>

                        <p className="text-xs text-white/40">
                            Plan · Focus · Finish
                        </p>
                    </div>
                </div>

            </div>

            {/* NAVIGATION */}
            <nav className="mt-8 flex flex-col gap-2">

                {links.map(
                    ({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `
                                group
                                flex
                                items-center
                                gap-3
                                rounded-2xl
                                px-4
                                py-3
                                border
                                transition-all
                                duration-200

                                ${isActive
                                    ? `
                                        bg-cyan-400/10
                                        border-cyan-400/20
                                        text-white
                                        `
                                    : `
                                        border-transparent
                                        text-white/50
                                        hover:bg-white/5
                                        hover:text-white
                                        `
                                }
                                `
                            }
                        >
                            <Icon size={18} />

                            <span className="text-sm font-medium">
                                {label}
                            </span>
                        </NavLink>
                    )
                )}

            </nav>

            {/* ACCOUNT */}
            <div className="mt-auto space-y-2">

                <div
                    className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        p-4
                    "
                >
                    <p className="text-xs text-white/40">
                        Signed in as
                    </p>

                    <p className="mt-1 truncate text-sm font-medium text-white">
                        {currentUser?.username}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        border-transparent
                        px-4
                        py-3
                        text-sm
                        font-medium
                        text-white/50
                        transition-all
                        duration-200
                        hover:bg-red-500/10
                        hover:text-red-300
                        disabled:opacity-50
                    "
                >
                    <LogOut size={18} aria-hidden="true" />
                    {signingOut ? "Logging out…" : "Log Out"}
                </button>

            </div>

        </div>
    );
}

export default Sidebar;