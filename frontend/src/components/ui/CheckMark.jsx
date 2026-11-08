import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// The round checkbox: an empty ring, or a filled emerald disc whose tick
// draws itself when the task is completed. Hover styles key off a parent
// with the `group/check` class. `size` is "md" (task rows) or "lg" (Today's
// Focus).
const SIZES = {
    md: { disc: "h-6 w-6", tick: "h-3.5 w-3.5", spinner: 18 },
    lg: { disc: "h-8 w-8", tick: "h-4.5 w-4.5", spinner: 22 },
};

function CheckMark({ checked, saving = false, size = "md" }) {
    const s = SIZES[size];

    if (saving) {
        return <Loader2 size={s.spinner} className="animate-spin text-cyan-300" aria-hidden="true" />;
    }

    return (
        <motion.span
            aria-hidden="true"
            initial={false}
            animate={checked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`flex ${s.disc} items-center justify-center rounded-full border-2 transition-colors duration-200
                ${checked
                    ? "border-emerald-400 bg-emerald-400 shadow-[0_0_18px_-2px_rgb(52_211_153/0.55)]"
                    : "border-white/25 group-hover/check:border-cyan-300 group-hover/check:bg-cyan-400/10"}`}
        >
            <svg viewBox="0 0 24 24" className={s.tick} fill="none">
                <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke={checked ? "#04140d" : "transparent"}
                    strokeWidth={3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: checked ? 0.05 : 0 }}
                />
            </svg>
        </motion.span>
    );
}

export default CheckMark;
