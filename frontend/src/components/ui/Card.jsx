import { motion } from "framer-motion";

function Card({
    children,
    className = "",
    variant = "default",
    interactive = false,
    padding = "md",
}) {
    const base =
        "rounded-2xl border backdrop-blur-xl transition-all";

    const variants = {
        default: "border-white/10 bg-white/5",
        subtle: "border-white/5 bg-white/[0.03]",
        elevated: "border-white/10 bg-black/20 shadow-lg",
        ghost: "border-transparent bg-transparent",
        glow: "border-cyan-400/20 bg-cyan-400/5 shadow-[0_0_30px_rgba(34,211,238,0.08)]",
    };

    const paddingMap = {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
    };

    return (
        <motion.div
            whileHover={interactive ? { y: -2 } : undefined}
            transition={{ duration: 0.2 }}
            className={`
                ${base}
                ${variants[variant]}
                ${paddingMap[padding]}
                ${className}
            `}
        >
            {children}
        </motion.div>
    );
}

export default Card;