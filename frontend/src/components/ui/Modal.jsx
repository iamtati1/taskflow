import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Modal({ open, onClose, children }) {
    // =====================================================
    // ESC CLOSE + SCROLL LOCK
    // =====================================================
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

                    {/* BACKDROP */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* MODAL PANEL */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="
                            relative
                            z-10
                            w-full
                            max-w-lg
                            rounded-2xl
                            border border-white/10
                            bg-[#0b0f1a]
                            shadow-2xl
                            overflow-hidden
                        "
                    >
                        {children}
                    </motion.div>

                </div>
            )}
        </AnimatePresence>
    );
}

export default Modal;