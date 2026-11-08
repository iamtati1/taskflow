import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { useNotifications } from "../../context/NotificationContext";

const ICONS = {
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    error: AlertTriangle,
};

const ICON_COLORS = {
    success: "text-emerald-300",
    info: "text-white/60",
    warning: "text-amber-300",
    error: "text-rose-300",
};

// Shows the toasts from NotificationContext: above the mobile nav on small
// screens, bottom right from the sidebar breakpoint (lg) up. The live region
// is always mounted, so screen readers announce toasts added to it later
function ToastViewport() {
    const { notifications, removeNotification } = useNotifications();
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Notifications"
            className="
                pointer-events-none
                fixed
                inset-x-4
                bottom-[calc(6rem+env(safe-area-inset-bottom))]
                z-50
                flex
                flex-col
                items-center
                gap-2
                sm:inset-x-auto
                sm:right-6
                sm:items-end
                lg:bottom-6
            "
        >
            <AnimatePresence initial={false}>
                {notifications.map(({ id, message, type }) => {
                    const Icon = ICONS[type] ?? Info;

                    return (
                        <motion.div
                            key={id}
                            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="
                                pointer-events-auto
                                flex
                                w-full
                                max-w-sm
                                items-start
                                gap-3
                                rounded-2xl
                                border
                                border-white/10
                                bg-raised/95
                                px-4
                                py-3
                                text-sm
                                text-white
                                shadow-lg
                                backdrop-blur-xl
                            "
                        >
                            <Icon
                                size={18}
                                aria-hidden="true"
                                className={`mt-0.5 shrink-0 ${ICON_COLORS[type] ?? ICON_COLORS.info}`}
                            />

                            <p className="min-w-0 flex-1 break-words">
                                {message}
                            </p>

                            <button
                                type="button"
                                onClick={() => removeNotification(id)}
                                aria-label="Dismiss notification"
                                className="shrink-0 rounded-lg p-0.5 text-white/50 transition hover:text-white"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default ToastViewport;
