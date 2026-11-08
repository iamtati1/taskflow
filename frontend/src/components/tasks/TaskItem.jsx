import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatDueDate } from "../../utils/dates";

import {
  CheckCircle2,
  Circle,
  Calendar,
  GripVertical,
  Loader2,
} from "lucide-react";

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

  // =====================================================
  // DERIVED STATE (clean + explicit)
  // =====================================================
  const isUpdating = isActiveActionId === task.task_id;
  const isCompleted = task.is_complete;

  const isLocked = isUpdating;

  // =====================================================
  // DATE FORMAT
  // =====================================================
  const dueDateLabel = task.due_date
    ? formatDueDate(task.due_date, { month: "short", day: "numeric" })
    : null;

  // =====================================================
  // INTERACTION HANDLERS (guarded)
  // =====================================================
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

  // =====================================================
  // VISUAL STATES (clean separation)
  // =====================================================
  const base =
    "group relative rounded-2xl border p-5 transition-all cursor-pointer";

  const state = [
    isSelected
      ? "border-cyan-400/40 bg-cyan-400/10"
      : "border-white/10 bg-black/20 hover:border-white/20",

    isCompleted ? "opacity-80" : "",

    isUpdating ? "ring-1 ring-cyan-400/30 opacity-90" : "",
  ].join(" ");

  // =====================================================
  // UI
  // =====================================================
  return (
    <motion.div
      layout
      onClick={handleSelect}
      whileHover={!isLocked ? { y: -2 } : {}}
      className={`${base} ${state}`}
    >
      <div className="flex gap-4">

        {/* CHECK */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLocked}
          aria-label={isCompleted ? "Mark as not done" : "Mark complete"}
          className="mt-1 shrink-0 transition-transform hover:scale-105 disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 size={18} className="text-cyan-300 animate-spin" />
          ) : isCompleted ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <Circle size={20} className="text-white/30 hover:text-white/60" />
          )}
        </button>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <h3
            className={`text-sm font-medium transition-all ${isCompleted
              ? "line-through text-white/30"
              : "text-white"
              }`}
          >
            {task.title}
          </h3>

          {/* ACTIONS (spaced apart so a click on Edit can't land on Delete) */}
          <div className="flex items-center gap-2">
            {/* EDIT BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="text-xs text-cyan-300 hover:text-cyan-200"
            >
              Edit
            </button>

            {/* DELETE BUTTON, then a confirmation in its place */}
            {confirmingDelete ? (
              <div
                role="group"
                aria-label="Delete this task?"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setConfirmingDelete(false);
                }}
                className="flex items-center gap-2 text-xs"
              >
                <span className="text-white/60">Delete this task?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    onDelete(task.task_id);
                  }}
                  className="rounded-lg bg-red-500/15 px-2 py-0.5 text-red-300 hover:bg-red-500/25"
                >
                  Yes, delete
                </button>
                <button
                  ref={keepRef}
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-lg px-2 py-0.5 text-white/70 hover:text-white"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                ref={deleteRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            )}
          </div>


          {/* META ROW */}
          {(dueDateLabel || isUpdating) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">

            {/* DUE DATE */}
            {dueDateLabel && (
              <div className="flex items-center gap-1 text-xs text-white/50">
                <Calendar size={12} />
                {dueDateLabel}
              </div>
            )}

            {/* STATUS TEXT (micro-feedback layer) */}
            {isUpdating && (
              <div className="text-xs text-cyan-300 animate-pulse">
                syncing
              </div>
            )}
          </div>
          )}
        </div>


        {/* DRAG HANDLE (visual cue; the card itself is draggable, see TaskList) */}
        <div
          aria-hidden="true"
          className="
                        self-center
                        opacity-0 group-hover:opacity-100
                        transition-opacity
                        text-white/30
                        cursor-grab active:cursor-grabbing
                    "
        >
          <GripVertical size={16} />
        </div>
      </div>
    </motion.div>
  );
}

export default TaskItem;