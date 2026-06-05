import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function TaskItem({
  task,
  onDelete = () => { },
  onToggle = () => { },
  onSelect = () => { },
  onEdit = async () => { },
  isSelected = false,
}) {
  // =====================================================
  // SAFETY
  // =====================================================

  const safeTask = task ?? {};

  if (!safeTask.task_id) {
    console.warn("Task missing task_id:", safeTask);
    return null;
  }

  const id = safeTask.task_id;

  // =====================================================
  // EDIT STATE
  // =====================================================

  const [isEditing, setIsEditing] = useState(false);

  const [editedTitle, setEditedTitle] = useState(
    safeTask.title || ""
  );

  const [editedPriority, setEditedPriority] = useState(
    safeTask.priority || "medium"
  );

  const [editedDueDate, setEditedDueDate] = useState(
    safeTask.due_date
      ? safeTask.due_date.slice(0, 10)
      : ""
  );

  useEffect(() => {
    setEditedTitle(safeTask.title || "");
    setEditedPriority(safeTask.priority || "medium");

    setEditedDueDate(
      safeTask.due_date
        ? safeTask.due_date.slice(0, 10)
        : ""
    );
  }, [safeTask]);

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    const result = await onEdit(id, {
      title: editedTitle,
      priority: editedPriority,
      due_date: editedDueDate || null,
    });

    if (result?.success !== false) {
      setIsEditing(false);
    }
  };

  // =====================================================
  // DRAG + DROP
  // =====================================================

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
  } = useSortable({
    id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ y: -2 }}
      className={`
        rounded-2xl
        border
        p-4
        cursor-pointer
        transition-all

        ${isSelected
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-white/10 bg-white/5"
        }
      `}
    >
      <div
        className="space-y-3"
        onClick={() => onSelect(id)}
      >
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editedTitle}
              onChange={(e) =>
                setEditedTitle(e.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              placeholder="Task title"
            />

            <select
              value={editedPriority}
              onChange={(e) =>
                setEditedPriority(e.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <input
              type="date"
              value={editedDueDate}
              onChange={(e) =>
                setEditedDueDate(e.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            />

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="rounded-lg px-3 py-2 border border-cyan-400"
              >
                Save
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
                className="rounded-lg px-3 py-2 border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-medium">
                {safeTask.title || "Untitled Task"}
              </h3>

              {safeTask.priority && (
                <p className="text-sm opacity-70">
                  Priority: {safeTask.priority}
                </p>
              )}

              {safeTask.due_date && (
                <p className="text-sm opacity-70">
                  Due: {safeTask.due_date.slice(0, 10)}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(id);
                }}
                className="rounded-lg border border-white/10 px-3 py-2"
              >
                {safeTask.is_complete
                  ? "Completed"
                  : "Complete"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="rounded-lg border border-white/10 px-3 py-2"
              >
                Edit
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="rounded-lg border border-red-400/40 px-3 py-2"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </motion.li>
  );
}

export default TaskItem;