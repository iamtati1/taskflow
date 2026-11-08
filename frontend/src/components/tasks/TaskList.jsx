import { useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ChevronDown, ListPlus } from "lucide-react";

import TaskItem from "./TaskItem";
import Button from "../ui/Button";
import { listItem, SOFT_SPRING } from "../../utils/motion";

// =====================================================
// SECTION
// =====================================================
// A titled list. Optionally collapsible: the content folds away smoothly
// and the toggle says whether it's open.
function TaskSection({ title, count, tone, collapsible = false, children }) {
    const [open, setOpen] = useState(true);
    const contentId = useId();

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <h3 className={`text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>
                    {title}
                </h3>
                <span className="tabular rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/55">
                    {count}
                </span>

                {collapsible && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={contentId}
                        onClick={() => setOpen((value) => !value)}
                        className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2 py-1 text-xs sm:min-h-0 text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                        {open ? "Hide" : "Show"}
                        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={14} aria-hidden="true" />
                        </motion.span>
                    </button>
                )}
            </div>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={contentId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <ul className="space-y-2.5">
                            {children}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// =====================================================
// EMPTY STATE
// =====================================================
function EmptyState({ onCreate }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-14 text-center"
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <ListPlus size={26} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">
                Nothing on your plate yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-white/55">
                Add the first thing you want to get done. You can give it a due date and drag tasks into the order you like.
            </p>
            {onCreate && (
                <Button className="mt-6" onClick={onCreate}>
                    Add your first task
                </Button>
            )}
        </motion.div>
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
    onCreate,
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

    // Which card is being dragged, and which one it's over (for feedback)
    const [draggingId, setDraggingId] = useState(null);
    const [overId, setOverId] = useState(null);

    // =====================================================
    // GROUP TASKS
    // =====================================================
    const active = tasks.filter((task) => !task?.is_complete);
    const completed = tasks.filter((task) => task?.is_complete);

    if (!tasks?.length) return <EmptyState onCreate={onCreate} />;

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
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(taskId);
    };

    const endDrag = () => {
        setDraggingId(null);
        setOverId(null);
    };

    const handleDrop = (e, toId, type) => {
        e.preventDefault();
        endDrag();

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

    const allowDrop = (e, taskId) => {
        e.preventDefault();
        if (overId !== taskId) setOverId(taskId);
    };

    // One list row: draggable, with feedback while dragging. Rows animate in
    // and out (a completed task leaves Active and arrives in Completed), and
    // the others slide to close the gap. No shared layoutId across sections:
    // that kept a second, clickable copy of the task alive mid-move.
    const row = (task, type) => (
        <motion.li
            key={task.task_id}
            layout="position"
            transition={SOFT_SPRING}
            variants={listItem}
            initial="initial"
            animate="animate"
            exit="exit"
            draggable
            onPointerDown={rememberPressTarget}
            onDragStart={(e) => handleDragStart(e, task.task_id, type)}
            onDragEnd={endDrag}
            onDragOver={(e) => allowDrop(e, task.task_id)}
            onDragLeave={() => setOverId((id) => (id === task.task_id ? null : id))}
            onDrop={(e) => handleDrop(e, task.task_id, type)}
            className={`relative rounded-2xl transition-[opacity,box-shadow] duration-150
                ${draggingId === task.task_id ? "opacity-40" : ""}
                ${overId === task.task_id && draggingId !== task.task_id
                    ? "shadow-[0_-3px_0_0_color-mix(in_oklab,var(--color-cyan-400)_80%,transparent)]"
                    : ""}`}
        >
            <TaskItem
                task={task}
                onDelete={onDelete}
                onToggle={onToggle}
                onEdit={onEdit}
                onSelect={() => onEdit(task)}
                isSelected={editingTaskId === task.task_id}
                isActiveActionId={activeActions[task.task_id] ? task.task_id : undefined}
            />
        </motion.li>
    );

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <LayoutGroup>
            <div className="space-y-8">
                {/* Touch screens can't drag-and-drop here, so they get their own hint */}
                <p className="text-sm text-white/50">
                    <span className="[@media(hover:none)]:hidden">Drag to reorder, click a task to edit it.</span>
                    <span className="hidden [@media(hover:none)]:inline">Tap a task to edit it.</span>
                </p>

                {active.length > 0 && (
                    <TaskSection title="Active" count={active.length} tone="text-cyan-300">
                        <AnimatePresence initial={false}>
                            {active.map((task) => row(task, "active"))}
                        </AnimatePresence>
                    </TaskSection>
                )}

                {completed.length > 0 && (
                    <div className="border-t border-white/[0.07] pt-6">
                        <TaskSection title="Completed" count={completed.length} tone="text-emerald-300" collapsible>
                            <AnimatePresence initial={false}>
                                {completed.map((task) => row(task, "completed"))}
                            </AnimatePresence>
                        </TaskSection>
                    </div>
                )}
            </div>
        </LayoutGroup>
    );
}

export default TaskList;
