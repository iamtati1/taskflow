// What a page shows instead of its content while the task list loads or
// after it failed to load, so neither looks like an empty workspace.
// Renders nothing once the tasks are in.
function TasksLoadState({ status, error, onRetry }) {
    if (status === "loading") {
        return (
            <div className="p-6 text-white/60">
                Loading tasks...
            </div>
        );
    }

    if (error) {
        return (
            <div role="alert" className="space-y-4 p-6">
                <p className="text-red-300">Couldn&apos;t load your tasks: {error}</p>
                <button
                    type="button"
                    onClick={() => onRetry()}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
                >
                    Try again
                </button>
            </div>
        );
    }

    return null;
}

export default TasksLoadState;
