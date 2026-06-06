import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  CheckCircle2,
  Circle,
  Calendar,
  Flag,
  GripVertical,
} from "lucide-react";

function TaskItem({
  task,
  isSelected = false,
  onSelect = () => { },
  onToggle = () => { },
}) {
  if (!task?.task_id) return null;

  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
  } = useSortable({
    id: task.task_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-red-400",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ y: -2 }}
      onClick={() => onSelect(task.task_id)}
      className={`
                group
                rounded-2xl
                border
                cursor-pointer
                transition-all
                p-4

                ${isSelected
          ? "border-cyan-400/40 bg-cyan-500/10"
          : "border-white/10 bg-white/[0.03]"
        }
            `}
    >
      <div className="flex items-start gap-3">

        {/* COMPLETE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.task_id);
          }}
          className="mt-0.5"
        >
          {task.is_complete ? (
            <CheckCircle2
              size={18}
              className="text-green-400"
            />
          ) : (
            <Circle
              size={18}
              className="text-white/40"
            />
          )}
        </button>

        {/* CONTENT */}
        <div className="flex-1 min-w-0">

          <h3
            className={`
                            font-medium
                            truncate

                            ${task.is_complete
                ? "line-through text-white/40"
                : "text-white"
              }
                        `}
          >
            {task.title}
          </h3>

          <div className="flex flex-wrap gap-4 mt-2 text-xs">

            <div className="flex items-center gap-1 text-white/50">
              <Flag
                size={12}
                className={
                  priorityColors[
                  task.priority
                  ]
                }
              />
              {task.priority}
            </div>

            {task.due_date && (
              <div className="flex items-center gap-1 text-white/50">
                <Calendar size={12} />
                {task.due_date.slice(0, 10)}
              </div>
            )}
          </div>
        </div>

        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
          className="
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        text-white/30
                    "
        >
          <GripVertical size={16} />
        </div>
      </div>
    </motion.div>
  );
}

export default TaskItem;