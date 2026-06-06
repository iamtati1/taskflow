import { motion } from "framer-motion";

function Button({
    children,
    onClick,
    variant = "primary",
    disabled = false,
    className = "",
    type = "button",
}) {
    const base =
        "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none";

    const variants = {
        primary:
            "bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]",
        secondary:
            "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10",
        ghost:
            "bg-transparent text-white/70 hover:bg-white/5",
        danger:
            "bg-red-500/10 text-red-300 border border-red-400/20 hover:bg-red-500/20",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
}

export default Button;