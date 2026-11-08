import { motion } from "framer-motion";
import { RefreshCw, WifiOff } from "lucide-react";

// What a page shows instead of its content while the task list loads or
// after it failed to load, so neither looks like an empty workspace.
// Renders nothing once the tasks are in.
function TasksLoadState({ status, error, onRetry }) {
    if (status === "loading") {
        return (
            <div role="status" className="space-y-6">
                <p className="text-sm text-white/50">Loading tasks...</p>

                {/* Placeholder shapes, so the page doesn't jump when it fills in */}
                <div aria-hidden="true" className="space-y-4">
                    <div className="h-9 w-48 animate-pulse rounded-xl bg-white/[0.06]" />
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" style={{ animationDelay: `${i * 120}ms` }} />
                        ))}
                    </div>
                    <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-start gap-4 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-6 sm:flex-row sm:items-center"
            >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                    <WifiOff size={20} aria-hidden="true" />
                </div>
                <p className="flex-1 text-rose-100">Couldn&apos;t load your tasks: {error}</p>
                <button
                    type="button"
                    onClick={() => onRetry()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 font-medium text-white transition-colors hover:bg-white/[0.1]"
                >
                    <RefreshCw size={15} aria-hidden="true" />
                    Try again
                </button>
            </motion.div>
        );
    }

    return null;
}

export default TasksLoadState;
