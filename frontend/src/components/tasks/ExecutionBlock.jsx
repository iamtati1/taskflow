import AddTaskForm from "./AddTaskForm";
import TaskList from "./TaskList";

function ExecutionBlock({
    tasks = [],
    isLoading,
    error,
    loadTasks,
    setSelectedTask,
}) {

    // =====================================================
    // DERIVED STATE (UI intelligence layer)
    // =====================================================
    const hasTasks = tasks?.length > 0;
    const isEmpty = !isLoading && !error && !hasTasks;

    return (
        <div className="space-y-6">

            {/* =====================================================
                HEADER / LABEL
            ===================================================== */}
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Execution Zone
                </p>

                {hasTasks && (
                    <p className="text-xs text-white/30">
                        {tasks.length} tasks active
                    </p>
                )}
            </div>

            {/* =====================================================
                TASK CREATION (PRIMARY ACTION SURFACE)
            ===================================================== */}
            <div className="
                flow-card
                p-6
                border border-white/10
                bg-white/[0.03]
                backdrop-blur-xl
                rounded-3xl
            ">
                <AddTaskForm loadTasks={loadTasks} />
            </div>

            {/* =====================================================
                LOADING STATE
            ===================================================== */}
            {isLoading && (
                <div className="flow-card p-5 text-white/50 animate-pulse">
                    Syncing your execution layer...
                </div>
            )}

            {/* =====================================================
                ERROR STATE
            ===================================================== */}
            {error && (
                <div className="
                    flow-card
                    p-5
                    border border-red-500/20
                    bg-red-500/10
                    text-red-300
                    rounded-2xl
                ">
                    <p className="text-sm font-medium">
                        Unable to load tasks
                    </p>
                    <p className="text-xs mt-1 text-red-200/70">
                        {error}
                    </p>

                    <button
                        onClick={loadTasks}
                        className="
                            mt-3
                            text-xs
                            text-red-200
                            underline
                            hover:text-red-100
                        "
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* =====================================================
                EMPTY STATE (IMPORTANT UX MOMENT)
            ===================================================== */}
            {isEmpty && (
                <div className="flow-card p-8 text-center">
                    <h3 className="text-white text-lg font-semibold">
                        No tasks yet
                    </h3>

                    <p className="mt-2 text-white/50 text-sm">
                        Create your first task to start building momentum.
                    </p>
                </div>
            )}

            {/* =====================================================
                TASK LIST (MAIN WORKSPACE)
            ===================================================== */}
            {hasTasks && (
                <div className="
                    flow-card
                    p-6
                    border border-white/10
                    bg-white/[0.03]
                    backdrop-blur-xl
                    rounded-3xl
                ">
                    <TaskList
                        tasks={tasks}
                        loadTasks={loadTasks}
                        setSelectedTask={setSelectedTask}
                    />
                </div>
            )}
        </div>
    );
}

export default ExecutionBlock;