import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// The app's buttons. Primary uses the theme's interactive colour with a soft
// glow; the others are quieter. `loading` shows a spinner and blocks
// clicks; `fullWidth` stretches it. Other props (aria-*, onKeyDown...) and
// the ref pass through.
const VARIANTS = {
    primary:
        "border border-cyan-300/50 bg-cyan-400 font-semibold text-slate-950 shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--color-cyan-400)_70%,transparent)] hover:bg-cyan-300 hover:shadow-[0_12px_36px_-8px_color-mix(in_oklab,var(--color-cyan-400)_80%,transparent)]",
    secondary:
        "border border-white/15 bg-white/[0.05] font-medium text-white hover:border-white/25 hover:bg-white/[0.09]",
    ghost:
        "border border-transparent bg-transparent font-medium text-white/70 hover:bg-white/[0.06] hover:text-white",
    danger:
        "border border-rose-400/25 bg-rose-500/10 font-medium text-rose-200 hover:bg-rose-500/20",
    subtle:
        "border border-white/[0.06] bg-white/[0.03] font-medium text-white/80 hover:bg-white/[0.06]",
};

const SIZES = {
    sm: "min-h-8 px-3 text-xs touch:min-h-11",
    md: "min-h-10 px-4 text-sm touch:min-h-11",
    lg: "min-h-12 px-5 text-sm",
};

const Button = forwardRef(function Button(
    {
        children,
        variant = "primary",
        size = "md",
        type = "button",
        loading = false,
        disabled = false,
        fullWidth = false,
        className = "",
        leftIcon: LeftIcon,
        rightIcon: RightIcon,
        ...rest
    },
    ref
) {
    const inactive = disabled || loading;

    return (
        <motion.button
            ref={ref}
            type={type}
            disabled={inactive}
            aria-busy={loading || undefined}
            whileHover={inactive ? undefined : { y: -1 }}
            whileTap={inactive ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`relative inline-flex items-center justify-center gap-2 rounded-xl transition-[background-color,border-color,box-shadow,color] duration-200 disabled:cursor-not-allowed disabled:opacity-55
                ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...rest}
        >
            {loading ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
                LeftIcon && <LeftIcon size={16} aria-hidden="true" />
            )}
            {children}
            {RightIcon && !loading && <RightIcon size={16} aria-hidden="true" />}
        </motion.button>
    );
});

export default Button;
