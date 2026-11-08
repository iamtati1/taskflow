// Shared motion presets, so pages move with one rhythm. MotionConfig
// (main.jsx) turns transforms off for people who prefer reduced motion.

// A soft ease-out used for entrances and most transitions
export const EASE_OUT = [0.22, 1, 0.36, 1];

// Springs for things that move in place (cards reordering, pills sliding)
export const SPRING = { type: "spring", stiffness: 420, damping: 34 };
export const SOFT_SPRING = { type: "spring", stiffness: 260, damping: 30 };

// A container whose children appear one after another
export const stagger = (delayChildren = 0.04, staggerChildren = 0.06) => ({
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
});

// Children of a stagger container: fade and rise into place
export const rise = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

// List items that enter, leave and move (tasks, toasts). A leaving item
// stops taking clicks at once: it may still show a task's old state (or a
// temporary id), so a click on it must not reach the server.
export const listItem = {
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto", transition: { duration: 0.3, ease: EASE_OUT } },
    exit: { opacity: 0, scale: 0.96, pointerEvents: "none", transition: { duration: 0.2 } },
};
