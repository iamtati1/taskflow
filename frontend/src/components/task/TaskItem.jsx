import { updateTask, deleteTask } from "../../adapters/task-adapters";

function TaskItem({ task, loadTasks, onSelect }) {
  // =========================
  // TOGGLE COMPLETE
  // =========================
  const handleChange = async (e) => {
    const { error } = await updateTask(task.task_id, {
      is_complete: e.target.checked,
    });

    if (error) return console.error(error);

    await loadTasks();
  };

  // =========================
  // DELETE TASK
  // =========================
  const handleDelete = async () => {
    const { error } = await deleteTask(task.task_id);

    if (error) return console.error(error);

    await loadTasks();
  };

  // =========================
  // PRIORITY SYSTEM
  // =========================
  const priorityStyles = {
    low: "bg-green-500/10 text-green-300 border border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
    high: "bg-red-500/10 text-red-300 border border-red-500/20",
  };

  return (
    <li
      className={`
        flow-card p-5
        hover-lift
        transition-all duration-300 ease-out
        ${task.is_complete ? "opacity-60" : ""}
      `}
    >

      {/* =========================
          MAIN ROW
      ========================= */}
      <div className="flex items-start justify-between gap-4">

        {/* LEFT SIDE */}
        <div className="flex items-start gap-4 flex-1">

          {/* CHECKBOX */}
          <input
            type="checkbox"
            checked={task.is_complete}
            onChange={handleChange}
            className="mt-1 h-5 w-5 accent-cyan-400 cursor-pointer"
          />

          {/* CONTENT */}
          <div className="space-y-2">

            <h3
              className={`
                text-section leading-snug transition
                ${task.is_complete ? "line-through text-muted" : ""}
              `}
            >
              {task.title}
            </h3>

            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-wider
                ${priorityStyles[task.priority || "medium"]}
              `}
            >
              {task.priority || "medium"} priority
            </span>

          </div>
        </div>

        {/* DELETE ACTION */}
        <button
          onClick={handleDelete}
          className="
            text-xs text-red-300
            hover:text-red-200
            transition-colors duration-200
          "
        >
          Delete
        </button>
      </div>

      {/* =========================
          ACTION ROW
      ========================= */}
      <div className="flex items-center justify-between pt-4">

        <button
          onClick={onSelect}
          className="
            btn-secondary text-xs
            hover:scale-[1.02]
            transition-transform
          "
        >
          ✨ Generate AI Plan
        </button>

      </div>

    </li>
  );
}

export default TaskItem;