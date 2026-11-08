import { motion } from "framer-motion";

// The app's raised surfaces. Every variant shares the radius, hairline
// border and depth; colour comes from the theme's roles (globals.css).
//   default   the standard panel
//   hero      lit by the theme's brand light (the Dashboard hero)
//   focus     a softly glowing brand-gradient border, for the one thing to
//             look at (Today's Focus)
//   subtle    quieter, for secondary notes
//   elevated  the opaque raised surface (overlays)
//   ghost     layout only
// Interactive cards lift slightly on hover. Other props pass through.
function Card({
    children,
    className = "",
    variant = "default",
    interactive = false,
    padding = "lg",
    ...rest
}) {
    const variants = {
        default:
            "border border-white/[0.08] bg-gradient-to-b from-white/[0.055] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_32px_-16px_rgba(0,0,0,0.6)]",
        hero: "surface-hero",
        focus: "surface-focus",
        subtle: "border border-white/[0.06] bg-white/[0.025]",
        elevated:
            "border border-white/10 bg-raised/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_-20px_rgba(0,0,0,0.75)] backdrop-blur-xl",
        ghost: "border border-transparent bg-transparent",
    };
    // Phase 3 name for the hero surface
    variants.glow = variants.hero;

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
            className={`rounded-2xl transition-colors ${variants[variant]} ${paddingMap[padding]} ${className}`}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

export default Card;
