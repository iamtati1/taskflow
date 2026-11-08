import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { EASE_OUT } from "../../utils/motion";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// A modal dialog on the app's raised surface: a sheet from the bottom on
// phones (with a grab handle, clear of the home indicator), centred from sm up.
// Keeps Tab inside, closes on Escape, locks page scroll while open, and
// returns focus to whatever opened it. The content decides what gets focus
// first (the dialog itself if nothing claims it).
function Dialog({ open, onClose, labelledBy, children }) {
    const panelRef = useRef(null);

    // The element that had focus when the dialog opened, read during the
    // render that opens it: before any content (autoFocus, effects) moves
    // focus inside
    const openerRef = useRef(null);
    const wasOpen = useRef(false);
    if (open && !wasOpen.current) openerRef.current = document.activeElement;
    wasOpen.current = open;

    // Lock scrolling while open; give focus back to the opener on close.
    // A passive effect: React restores focus to whatever had it before a
    // commit, which would undo a focus() made during the commit itself.
    useEffect(() => {
        if (!open) return undefined;
        const opener = openerRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const frame = requestAnimationFrame(() => {
            const panel = panelRef.current;
            if (panel && !panel.contains(document.activeElement)) panel.focus();
        });

        return () => {
            cancelAnimationFrame(frame);
            document.body.style.overflow = previousOverflow;
            // Not when nothing in particular had focus (the page body)
            if (opener instanceof HTMLElement && opener !== document.body && document.contains(opener)) {
                opener.focus();
            }
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
                // The key keeps the content mounted (not re-created) while it animates out
                <div key="dialog" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[#02030a]/60 backdrop-blur-[6px]"
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
                        className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-raised pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.85)] outline-none sm:max-w-lg sm:rounded-3xl sm:pb-0"
                        initial={{ opacity: 0, y: 32, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease: EASE_OUT } }}
                        exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18 } }}
                    >
                        <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default Dialog;
