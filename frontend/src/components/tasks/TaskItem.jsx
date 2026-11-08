import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";

import DueChip from "./DueChip";

// The round checkbox: an empty ring, or a filled accent disc whose tick
// draws itself when the task is completed
function CheckMark({ checked, saving }) {
    if (saving) {
        return <Loader2 size={18} className="animate-spin text-cyan-300" aria-hidden="true" />;
    }

    return (
        <motion.span
            aria-hidden="true"
            initial={false}
            animate={checked ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200
                ${checked
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-white/25 group-hover/check:border-cyan-300 group-hover/check:bg-cyan-400/10"}`}
        >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
                <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke={checked ? "#04140d" : "transparent"}
                    strokeWidth={3.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: checked ? 0.05 : 0 }}
                />
            </svg>
        </motion.span>
    );
}

function TaskItem({
    task,
    onSelect = () => { },
    onToggle = () => { },
    onEdit = () => { },
    onDelete = () => { },
    isSelected = false,
    isActiveActionId,
}) {
    // Deleting is permanent, so Delete first asks (inline, focus on Keep)
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const deleteRef = useRef(null);
    const keepRef = useRef(null);
    const wasConfirming = useRef(false);

    useEffect(() => {
        if (confirmingDelete) keepRef.current?.focus();
        else if (wasConfirming.current) deleteRef.current?.focus();
        wasConfirming.current = confirmingDelete;
    }, [confirmingDelete]);

    if (!task?.task_id) return null;

    const isUpdating = isActiveActionId === task.task_id;
    const isCompleted = task.is_complete;
    const isLocked = isUpdating;

    const handleSelect = () => {
        if (isLocked) return;
        onSelect(task.task_id);
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        if (isLocked) return;
        // A completed task moves to the other section at once, so the second
        // click of a double-click would land on (and toggle) the next task
        if (e.detail > 1) return;
        onToggle(task.task_id);
    };

    return (
        <div
            onClick={handleSelect}
            className={`group relative flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-200 cursor-pointer
                ${isSelected
                    ? "border-cyan-400/45 bg-cyan-400/[0.08] shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-cyan-400)_25%,transparent)]"
                    : isCompleted
                        ? "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                        : "border-white/[0.09] bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.055]"}
                ${isUpdating ? "ring-1 ring-cyan-400/30" : ""}`}
        >
            {/* CHECK (first control in the card) */}
            <button
                type="button"
                onClick={handleToggle}
                disabled={isLocked}
                aria-label={isCompleted ? "Mark as not done" : "Mark complete"}
                className="group/check -m-1.5 shrink-0 rounded-full p-1.5 disabled:opacity-60"
            >
                <CheckMark checked={isCompleted} saving={isUpdating} />
            </button>

            {/* CONTENT */}
            <div className="min-w-0 flex-1">
                <h3
                    className={`break-words font-sans text-[15px] font-medium leading-snug transition-colors duration-300
                        ${isCompleted ? "text-white/40 line-through decoration-white/30" : "text-white"}`}
                >
                    {task.title}
                </h3>

                {(task.due_date || isUpdating) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <DueChip dueDate={task.due_date} done={isCompleted} />
                        {isUpdating && (
                            <span className="animate-pulse text-xs text-cyan-300">
                                syncing
                            </span>
                        )}
                    </div>
                )}

                {/* ACTIONS (spaced apart so a click on Edit can't land on Delete) */}
                <div className="mt-2.5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(task);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-cyan-200"
                    >
                        <Pencil size={12} aria-hidden="true" />
                        Edit
                    </button>

                    {/* DELETE, then a confirmation in its place */}
                    {confirmingDelete ? (
                        <motion.div
                            role="group"
                            aria-label="Delete this task?"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") setConfirmingDelete(false);
                            }}
                            className="flex flex-wrap items-center gap-2 text-xs"
                        >
                            <span className="text-white/60">Delete this task?</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmingDelete(false);
                                    onDelete(task.task_id);
                                }}
                                className="rounded-lg bg-rose-500/15 px-2.5 py-1 font-medium text-rose-300 transition-colors hover:bg-rose-500/25"
                            >
                                Yes, delete
                            </button>
                            <button
                                ref={keepRef}
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                className="rounded-lg px-2.5 py-1 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                Keep
                            </button>
                        </motion.div>
                    ) : (
                        <button
                            ref={deleteRef}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmingDelete(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-white/55 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <Trash2 size={12} aria-hidden="true" />
                            Delete
                        </button>
                    )}
                </div>
            </div>

            {/* DRAG HANDLE (a cue; the whole card is draggable, see TaskList) */}
            <div
                aria-hidden="true"
                className="hidden self-center text-white/25 transition-colors group-hover:text-white/55 sm:block cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={16} />
            </div>
        </div>
    );
}

export default TaskItem;
