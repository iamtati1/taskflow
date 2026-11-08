import { AnimatePresence, motion } from "framer-motion";

// The look of every text-like control (text, password, date). Inputs also
// show an error state through aria-invalid.
export const fieldClass =
    "h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder-white/30 [color-scheme:dark] hover:border-white/20 focus:border-cyan-400/60 focus:bg-black/40 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-cyan-400)_14%,transparent)] aria-[invalid=true]:border-rose-400/60";

// A labelled control: label above, then the control (children), then an
// optional hint and an announced error. Give the control id={id}, and
// aria-describedby={describedBy(id, hint, error)} to link the text.
export const describedBy = (id, hint, error) =>
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

function Field({ id, label, hint, error, action, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor={id} className="text-sm font-medium text-white/80">
                    {label}
                </label>
                {action}
            </div>

            {children}

            {hint && (
                <p id={`${id}-hint`} className="text-xs text-white/50">
                    {hint}
                </p>
            )}

            <AnimatePresence>
                {error && (
                    <motion.p
                        id={`${id}-error`}
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-rose-300"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Field;
