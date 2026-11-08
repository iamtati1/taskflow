import { useRef } from "react";

import TaskItem from "./TaskItem";

// =====================================================
// SECTION COMPONENT
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

            <ul className="space-y-3">{children}</ul>
        </section>
    );
}

// =====================================================
// EMPTY STATE
// =====================================================
function EmptyState() {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl text-center">
            <h2 className="text-2xl font-semibold text-white">
                Nothing on your plate yet
            </h2>

            <p className="mt-3 max-w-md mx-auto text-sm text-white/50">
                Create your first task and start building momentum.
            </p>
        </div>
    );
}

// =====================================================
// MAIN COMPONENT (DRAG ENABLED)
// =====================================================
function TaskList({
    tasks = [],
    onDelete,
    onToggle,
    onEdit,
    editingTaskId, // highlighted while it is open in the editor
    activeActions = {}, // task_id -> the action being saved
    reorderTasks,
}) {
    // A press that starts on a control (Edit, Delete, the checkbox) must stay
    // a click: in a draggable card, moving a few pixels during the click
    // otherwise starts a drag and the click never fires
    const pressedOnControl = useRef(false);
    const rememberPressTarget = (e) => {
        pressedOnControl.current = !!e.target.closest("button, a, input, textarea, select");
    };

    // =====================================================
    // GROUP TASKS
    // =====================================================
    const grouped = tasks.reduce(
        (acc, task) => {
            if (task?.is_complete) acc.completed.push(task);
            else acc.active.push(task);
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
    // DRAG HANDLERS
    // =====================================================
    // Drags carry the task's id: a position within one section isn't a
    // position in the full list
    const handleDragStart = (e, taskId, type) => {
        if (pressedOnControl.current) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({ taskId, type })
        );
    };

    const handleDrop = (e, toId, type) => {
        e.preventDefault();

        // Anything dropped from outside TaskFlow (text, links) is ignored
        let data;
        try {
            data = JSON.parse(e.dataTransfer.getData("text/plain"));
        } catch {
            return;
        }
        if (!data || data.taskId === undefined) return;

        // Tasks move within their own section only
        if (data.type !== type) return;

        reorderTasks(data.taskId, toId);
    };

    // Props shared by every card: clicking one opens it in the editor
    const itemProps = (task) => ({
        task,
        onDelete,
        onToggle,
        onEdit,
        onSelect: () => onEdit(task),
        isSelected: editingTaskId === task.task_id,
        isActiveActionId: activeActions[task.task_id] ? task.task_id : undefined,
    });

    const allowDrop = (e) => e.preventDefault();

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

            {/* HEADER */}
            <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                    Focus Workspace
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                    Your Tasks
                </h2>

                <p className="mt-2 text-sm text-white/50">
                    Drag to reorder, click to manage.
                </p>
            </div>

            <div className="space-y-10">

                {/* =====================================================
                    ACTIVE TASKS
                ===================================================== */}
                {active.length > 0 && (
                    <TaskSection
                        title="Active"
                        count={active.length}
                        color="text-cyan-300"
                    >
                        {active.map((task) => (
                            <div
                                key={task.task_id}
                                draggable
                                onPointerDown={rememberPressTarget}
                                onDragStart={(e) =>
                                    handleDragStart(e, task.task_id, "active")
                                }
                                onDragOver={allowDrop}
                                onDrop={(e) =>
                                    handleDrop(e, task.task_id, "active")
                                }
                            >
                                <TaskItem {...itemProps(task)} />
                            </div>
                        ))}
                    </TaskSection>
                )}

                {/* =====================================================
                    COMPLETED TASKS
                ===================================================== */}
                {completed.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                        <TaskSection
                            title="Completed"
                            count={completed.length}
                            color="text-emerald-400"
                        >
                            {completed.map((task) => (
                                <div
                                    key={task.task_id}
                                    draggable
                                    onPointerDown={rememberPressTarget}
                                    onDragStart={(e) =>
                                        handleDragStart(e, task.task_id, "completed")
                                    }
                                    onDragOver={allowDrop}
                                    onDrop={(e) =>
                                        handleDrop(e, task.task_id, "completed")
                                    }
                                >
                                    <TaskItem {...itemProps(task)} />
                                </div>
                            ))}
                        </TaskSection>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TaskList;