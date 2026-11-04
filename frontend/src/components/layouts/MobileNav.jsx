import { NavLink } from "react-router-dom";

import { links } from "./Sidebar";

// Bottom navigation for screens narrower than the sidebar breakpoint (lg),
// where the sidebar is hidden
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
                border-white/10
                bg-[#050816]/90
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
                                `flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive
                                    ? "text-cyan-300"
                                    : "text-white/50 hover:text-white"
                                }`
                            }
                        >
                            <Icon size={20} aria-hidden="true" />
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default MobileNav;
