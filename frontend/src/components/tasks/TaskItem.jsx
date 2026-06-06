import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  GripVertical,
  Loader2,
} from "lucide-react";

function TaskItem({
  task,
  isSelected = false,
  onSelect = () => { },
  onToggle = () => { },
  isActiveActionId,
}) {
  if (!task?.task_id) return null;

  // =====================================================
  // DRAG ENGINE
  // =====================================================
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.task_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // =====================================================
  // DERIVED STATE (clean + explicit)
  // =====================================================
  const isUpdating = isActiveActionId === task.task_id;
  const isCompleted = task.is_complete;

  const isLocked = isUpdating || isDragging;

  // =====================================================
  // PRIORITY SYSTEM (visual tokens)
  // =====================================================
  const priorityStyles = {
    low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    high: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  };

  const priorityClass = priorityStyles[task.priority] || priorityStyles.medium;

  // =====================================================
  // DATE FORMAT
  // =====================================================
  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })
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

    isDragging ? "scale-[1.02] shadow-xl" : "",

    isUpdating ? "ring-1 ring-cyan-400/30 opacity-90" : "",
  ].join(" ");

  // =====================================================
  // UI
  // =====================================================
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      onClick={handleSelect}
      whileHover={!isLocked ? { y: -2 } : {}}
      animate={{
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`${base} ${state}`}
    >
      <div className="flex gap-4">

        {/* CHECK */}
        <button
          onClick={handleToggle}
          disabled={isLocked}
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

          {/* META ROW */}
          <div className="mt-4 flex flex-wrap items-center gap-2">

            {/* PRIORITY */}
            <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${priorityClass}`}>
              <Flag size={12} />
              <span className="capitalize">{task.priority}</span>
            </div>

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
        </div>

        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
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