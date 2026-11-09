import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, CircleDot, ListPlus } from "lucide-react";

import TaskItem from "./TaskItem";
import Button from "../ui/Button";
import SectionHeader from "../ui/SectionHeader";
import { listItem, SOFT_SPRING } from "../../utils/motion";

// How long a just-completed task stays in Active, ticked, before it moves
// to Completed. The save starts at once; only the move waits.
export const SETTLE_MS = 650;

// =====================================================
// SECTION
// =====================================================
// A titled list. Optionally collapsible: the content folds away smoothly
// and the toggle says whether it's open.
function TaskSection({ title, icon, count, tone, collapsible = false, children }) {
    const [open, setOpen] = useState(true);
    const contentId = useId();

    return (
        <section className="space-y-3">
            <SectionHeader
                as="h3"
                icon={icon}
                tone={tone}
                count={count}
                action={collapsible && (
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={contentId}
                        onClick={() => setOpen((value) => !value)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white sm:min-h-0 touch:min-h-11"
                    >
                        {open ? "Hide" : "Show"}
                        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={14} aria-hidden="true" />
                        </motion.span>
                    </button>
                )}
            >
                {title}
            </SectionHeader>

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
    onOpen, // a click on the card (defaults to onEdit)
    onCreate,
    editingTaskId, // highlighted while it is open in details or the editor
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

    // Which card is being dragged (and from which section), and which one
    // it's over (for feedback)
    const [dragging, setDragging] = useState(null); // { id, type }
    const [overId, setOverId] = useState(null);

    // =====================================================
    // COMPLETION: tick first, then move
    // =====================================================
    const [settling, setSettling] = useState(() => new Set());
    const timers = useRef(new Map());
    useEffect(() => {
        const pending = timers.current;
        return () => pending.forEach(clearTimeout);
    }, []);

    const settle = (id, on) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setSettling((prev) => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });
    };

    const handleToggle = (id) => {
        const task = tasks.find((t) => t.task_id === id);
        if (task && !task.is_complete) {
            settle(id, true);
            timers.current.set(id, setTimeout(() => settle(id, false), SETTLE_MS));
        } else {
            settle(id, false);
        }
        return onToggle?.(id);
    };

    // =====================================================
    // NEW TASKS glow briefly as they arrive (not the ones already there)
    // =====================================================
    const seen = useRef(null);
    const [fresh, setFresh] = useState(() => new Set());
    useEffect(() => {
        const ids = tasks.map((task) => task.task_id);
        if (seen.current) {
            const added = ids.filter((id) => !seen.current.has(id));
            if (added.length) {
                setFresh(new Set(added));
                const timer = setTimeout(() => setFresh(new Set()), 1600);
                seen.current = new Set(ids);
                return () => clearTimeout(timer);
            }
        }
        seen.current = new Set(ids);
        return undefined;
    }, [tasks]);

    // =====================================================
    // GROUP TASKS
    // =====================================================
    const isActive = (task) => !task?.is_complete || settling.has(task.task_id);
    const active = tasks.filter(isActive);
    const completed = tasks.filter((task) => !isActive(task));

    // Where a dragged card will land relative to the one it's over: the
    // reorder puts it after a card below it, before a card above it
    const order = new Map(tasks.map((task, index) => [task.task_id, index]));
    const dropsBelow = (overTaskId) => order.get(dragging?.id) < order.get(overTaskId);

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
        setDragging({ id: taskId, type });
    };

    const endDrag = () => {
        setDragging(null);
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

    // Only cards in the dragged card's own section accept it
    const allowDrop = (e, taskId, type) => {
        if (dragging && dragging.type !== type) {
            e.dataTransfer.dropEffect = "none";
            return;
        }
        e.preventDefault();
        if (overId !== taskId) setOverId(taskId);
    };

    // One list row: draggable, with feedback while dragging. Rows animate in
    // and out (a completed task leaves Active and arrives in Completed), and
    // the others slide to close the gap. No shared layoutId across sections:
    // that kept a second, clickable copy of the task alive mid-move.
    const row = (task, type) => {
        const isDragged = dragging?.id === task.task_id;
        const isTarget = overId === task.task_id && dragging && !isDragged;

        return (
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
                onDragOver={(e) => allowDrop(e, task.task_id, type)}
                onDragLeave={() => setOverId((id) => (id === task.task_id ? null : id))}
                onDrop={(e) => handleDrop(e, task.task_id, type)}
                className={`relative rounded-2xl transition-[opacity,outline-color] duration-150
                    ${isDragged ? "opacity-45 outline-2 outline-dashed outline-offset-2 outline-cyan-400/40" : "outline-transparent"}`}
            >
                {/* Drop line: where the dragged card will land */}
                {isTarget && (
                    <motion.span
                        aria-hidden="true"
                        layoutId="drop-line"
                        transition={{ duration: 0.12 }}
                        className={`pointer-events-none absolute inset-x-3 z-10 h-[3px] rounded-full bg-cyan-400 shadow-[0_0_12px_var(--color-cyan-400)]
                            ${dropsBelow(task.task_id) ? "-bottom-[7px]" : "-top-[7px]"}`}
                    />
                )}

                {/* A brief glow on a task that has just been added */}
                <AnimatePresence>
                    {fresh.has(task.task_id) && (
                        <motion.span
                            aria-hidden="true"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.8 } }}
                            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-400/50 shadow-[0_0_24px_-6px_var(--color-cyan-400)]"
                        />
                    )}
                </AnimatePresence>

                <TaskItem
                    task={task}
                    onDelete={onDelete}
                    onToggle={handleToggle}
                    onEdit={onEdit}
                    onSelect={() => (onOpen ?? onEdit)(task)}
                    isSelected={editingTaskId === task.task_id}
                    isActiveActionId={activeActions[task.task_id] ? task.task_id : undefined}
                />
            </motion.li>
        );
    };

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <LayoutGroup>
            <div className="space-y-8">
                {/* For screen readers: Active and Completed are this list's h3s */}
                <h2 className="sr-only">Your tasks</h2>

                {/* Touch screens can't drag-and-drop here, so they get their own hint */}
                <p className="text-sm text-white/50">
                    <span className="[@media(hover:none)]:hidden">Drag to reorder, click a task to edit it.</span>
                    <span className="hidden [@media(hover:none)]:inline">Tap a task to edit it.</span>
                </p>

                {active.length > 0 && (
                    <TaskSection title="Active" icon={CircleDot} count={active.length} tone="accent">
                        <AnimatePresence initial={false}>
                            {active.map((task) => row(task, "active"))}
                        </AnimatePresence>
                    </TaskSection>
                )}

                {completed.length > 0 && (
                    <div className="border-t border-white/[0.07] pt-6">
                        <TaskSection title="Completed" icon={CheckCircle2} count={completed.length} tone="emerald" collapsible>
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
