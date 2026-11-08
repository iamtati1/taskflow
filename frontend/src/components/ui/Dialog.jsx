import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { EASE_OUT } from "../../utils/motion";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// A modal dialog: a sheet from the bottom on phones, centred from sm up.
// Keeps Tab inside, closes on Escape, locks page scroll while open, and
// returns focus to whatever opened it. The content decides what gets focus
// first (the dialog itself if nothing claims it).
function Dialog({ open, onClose, labelledBy, children }) {
    const panelRef = useRef(null);

    // Remember the opener and lock scrolling while open
    useEffect(() => {
        if (!open) return undefined;
        const opener = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const frame = requestAnimationFrame(() => {
            const panel = panelRef.current;
            if (panel && !panel.contains(document.activeElement)) panel.focus();
        });

        return () => {
            cancelAnimationFrame(frame);
            document.body.style.overflow = previousOverflow;
            if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
        };
    }, [open]);

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose?.();
            return;
        }
        if (e.key !== "Tab") return;

        const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        tabIndex={-1}
                        onKeyDown={handleKeyDown}
                        className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl outline-none sm:max-w-lg sm:rounded-3xl"
                        initial={{ opacity: 0, y: 32, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: EASE_OUT } }}
                        exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18 } }}
                    >
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default Dialog;
