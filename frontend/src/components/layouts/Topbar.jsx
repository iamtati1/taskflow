import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import BrandMark from "../ui/BrandMark";

// The bar above every page. Each page has its own heading, so this one
// doesn't repeat it: on phones it shows the brand and the page's name, from
// the sidebar breakpoint (lg) a greeting. The date and an account shortcut
// sit on the right.
function Topbar({ title }) {
    const { currentUser } = useAuth();

    const hour = new Date().getHours();
    const greeting =
        hour < 12
            ? "Good morning"
            : hour < 18
                ? "Good afternoon"
                : "Good evening";

    const name = currentUser?.username;

    return (
        <header className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:px-10">

            {/* PHONES / TABLETS: brand + where you are */}
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <BrandMark compact />
                <p className="truncate font-display text-base font-semibold text-white">
                    {title}
                </p>
            </div>

            {/* DESKTOP: greeting */}
            <p className="hidden truncate text-sm text-white/60 lg:block">
                {greeting}
                {name && (
                    <>
                        , <span className="font-semibold text-white">{name}</span>
                    </>
                )}
            </p>

            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 md:flex">
                    <CalendarDays size={15} aria-hidden="true" className="text-cyan-300" />
                    {new Date().toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                    })}
                </div>

                <Link
                    to="/settings"
                    aria-label="Account settings"
                    className="flex h-9 w-9 items-center justify-center rounded-xl touch:h-11 touch:w-11 bg-gradient-to-br from-brand-a to-brand-b text-sm font-bold text-slate-950 shadow-[0_8px_24px_-8px_var(--brand-b)] transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                    {name?.[0]?.toUpperCase() || "?"}
                </Link>
            </div>
        </header>
    );
}

export default Topbar;
