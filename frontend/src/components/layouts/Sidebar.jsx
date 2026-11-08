import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ListChecks,
    BarChart3,
    Settings,
    LogOut,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import BrandMark from "../ui/BrandMark";
import { SPRING } from "../../utils/motion";

// Shared with MobileNav so both navigations list the same pages
export const links = [
    {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
    },
    {
        to: "/tasks",
        label: "Tasks",
        icon: ListChecks,
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

    const initial = currentUser?.username?.[0]?.toUpperCase() || "?";

    return (
        <div className="flex h-full flex-col px-4 py-6">

            {/* BRAND */}
            <div className="px-2 pb-6">
                <BrandMark tagline />
            </div>

            {/* NAVIGATION: the highlight slides to the current page */}
            <nav aria-label="Main" className="flex flex-col gap-1">
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200
                            ${isActive ? "text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        layoutId="sidebar-active"
                                        transition={SPRING}
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-xl border border-brand-a/30 bg-gradient-to-r from-brand-a/20 via-brand-b/[0.08] to-transparent shadow-[inset_2px_0_0_0_var(--brand-a)]"
                                    />
                                )}
                                <Icon
                                    size={18}
                                    aria-hidden="true"
                                    className={`relative transition-colors ${isActive ? "text-brand-a" : "text-white/50 group-hover:text-white/80"}`}
                                />
                                <span className="relative">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ACCOUNT */}
            <div className="mt-auto space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <div
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-a to-brand-b text-sm font-bold text-slate-950"
                    >
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-white/50">
                            Signed in as
                        </p>
                        <p className="truncate text-sm font-semibold text-white">
                            {currentUser?.username}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors duration-200 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                >
                    <LogOut size={18} aria-hidden="true" />
                    {signingOut ? "Logging out…" : "Log Out"}
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
