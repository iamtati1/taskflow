import { motion } from "framer-motion";

// The app's one surface: a panel a little lighter than the background,
// with a hairline border and a faint top highlight for depth. Interactive
// cards lift slightly on hover. Other props (aria-*, ids) pass through.
function Card({
    children,
    className = "",
    variant = "default",
    interactive = false,
    padding = "lg",
    ...rest
}) {
    const base = "rounded-2xl border transition-colors";

    const variants = {
        default:
            "border-white/[0.08] bg-gradient-to-b from-white/[0.055] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_-16px_rgba(0,0,0,0.6)]",
        subtle: "border-white/[0.06] bg-white/[0.025]",
        elevated:
            "border-white/10 bg-[#0b1024]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl",
        ghost: "border-transparent bg-transparent",
        glow:
            "border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.08] to-white/[0.02] shadow-[0_0_40px_-12px_color-mix(in_oklab,var(--color-cyan-400)_35%,transparent)]",
    };

    const paddingMap = {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-5 sm:p-6",
        xl: "p-6 sm:p-8",
    };

    return (
        <motion.div
            whileHover={interactive ? { y: -2 } : undefined}
            transition={{ duration: 0.2 }}
            className={`${base} ${variants[variant]} ${paddingMap[padding]} ${className}`}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

export default Card;
