import { motion } from "framer-motion";

function Button({
    children,
    onClick,
    variant = "primary",
    disabled = false,
    loading = false,
    className = "",
    type = "button",
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
}) {
    const base =
        "relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary:
            "bg-cyan-400 text-slate-950 font-semibold border border-cyan-300/60 hover:bg-cyan-300 shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--color-cyan-400)_60%,transparent)]",

        secondary:
            "bg-white/5 text-white/80 border border-white/10 hover:bg-white/10",

        ghost:
            "bg-transparent text-white/70 hover:bg-white/5",

        danger:
            "bg-red-500/10 text-red-300 border border-red-400/20 hover:bg-red-500/20",

        subtle:
            "bg-white/[0.03] text-white/80 border border-white/5 hover:bg-white/[0.06]",
    };

    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={disabled || loading ? {} : { y: -1 }}
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${base} ${variants[variant]} ${className}`}
        >
            {/* LOADING STATE */}
            {loading ? (
                <span className="animate-pulse text-white/60">
                    Loading...
                </span>
            ) : (
                <>
                    {LeftIcon && <LeftIcon size={16} />}
                    {children}
                    {RightIcon && <RightIcon size={16} />}
                </>
            )}
        </motion.button>
    );
}

export default Button;