import TaskItem from "./TaskItem";

// =====================================================
// SECTION COMPONENT (reusable)
// =====================================================
function TaskSection({ title, count, color, children }) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-sm uppercase tracking-[0.2em] ${color}`}>
                    {title}
                </h3>
                <span className="text-sm text-white/40">{count}</span>
            </div>

            <ul className="space-y-3">
                {children}
            </ul>
        </section>
    );
}

// =====================================================
// EMPTY STATE
// =====================================================
function EmptyState() {
    return (
        <div className="
            rounded-3xl
            border border-white/10
            bg-white/[0.03]
            p-10
            backdrop-blur-xl
            text-center
        ">
            <h2 className="text-2xl font-semibold text-white">
                Nothing on your plate yet
            </h2>

            <p className="mt-3 max-w-md mx-auto text-sm text-white/50">
                Create your first task and start building momentum.
                Every system starts with a single action.
            </p>
        </div>
    );
}

// =====================================================
// MAIN COMPONENT
// =====================================================
function TaskList({
    tasks = [],
    onDelete,
    onToggle,
    onSelect,
    onEdit,
    selectedTaskId,
}) {

    // =====================================================
    // DATA PIPELINE (single pass grouping = faster + cleaner)
    // =====================================================
    const grouped = tasks.reduce(
        (acc, task) => {
            if (task?.is_complete) {
                acc.completed.push(task);
            } else {
                acc.active.push(task);
            }
            return acc;
        },
        { active: [], completed: [] }
    );

    const { active, completed } = grouped;

    // =====================================================
    // EMPTY STATE
    // =====================================================
    if (!tasks?.length) return <EmptyState />;

    // =====================================================
    // UI
    // =====================================================
    return (
        <div className="
            rounded-3xl
            border border-white/10
            bg-white/[0.03]
            p-6
            backdrop-blur-xl
        ">
            {/* HEADER */}
            <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Focus Workspace
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                    Your Tasks
                </h2>

                <p className="mt-2 text-sm text-white/50">
                    Manage execution flow, track progress, and stay focused.
                </p>
            </div>

            <div className="space-y-10">

                {/* ACTIVE TASKS */}
                {active.length > 0 && (
                    <TaskSection
                        title="Active"
                        count={active.length}
                        color="text-cyan-300"
                    >
                        {active.map((task) => (
                            <TaskItem
                                key={task.task_id}
                                task={task}
                                onDelete={onDelete}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                onEdit={onEdit}
                                isSelected={selectedTaskId === task.task_id}
                            />
                        ))}
                    </TaskSection>
                )}

                {/* COMPLETED TASKS */}
                {completed.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                        <TaskSection
                            title="Completed"
                            count={completed.length}
                            color="text-emerald-400"
                        >
                            {completed.map((task) => (
                                <TaskItem
                                    key={task.task_id}
                                    task={task}
                                    onDelete={onDelete}
                                    onToggle={onToggle}
                                    onSelect={onSelect}
                                    onEdit={onEdit}
                                    isSelected={selectedTaskId === task.task_id}
                                />
                            ))}
                        </TaskSection>
                    </div>
                )}

            </div>
        </div>
    );
}

export default TaskList;