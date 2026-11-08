import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

import { links } from "./Sidebar";
import { SPRING } from "../../utils/motion";

// Bottom navigation for screens narrower than the sidebar breakpoint (lg),
// where the sidebar is hidden. The current page's pill slides between tabs.
function MobileNav() {
    return (
        <nav
            aria-label="Main"
            className="
                fixed
                inset-x-0
                bottom-0
                z-30
                border-t
                border-white/[0.08]
                bg-base/85
                backdrop-blur-xl
                lg:hidden
            "
        >
            <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
                {links.map(({ to, label, icon: Icon }) => (
                    <li key={to} className="flex-1">
                        <NavLink
                            to={to}
                            className={({ isActive }) =>
                                `relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${isActive
                                    ? "text-cyan-300"
                                    : "text-white/50 hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className="relative flex h-8 w-14 items-center justify-center">
                                        {isActive && (
                                            <motion.span
                                                layoutId="mobile-active"
                                                transition={SPRING}
                                                aria-hidden="true"
                                                className="absolute inset-0 rounded-full bg-cyan-400/15"
                                            />
                                        )}
                                        <Icon size={20} aria-hidden="true" className="relative" />
                                    </span>
                                    {label}
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default MobileNav;
