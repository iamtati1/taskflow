import { motion, AnimatePresence } from "framer-motion";

function Modal({ open, onClose, children }) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">

                    {/* BACKDROP */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* MODAL CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="
                            relative
                            z-10
                            w-full
                            max-w-md
                            rounded-2xl
                            border border-white/10
                            bg-[#0b0f1a]
                            p-6
                            shadow-2xl
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