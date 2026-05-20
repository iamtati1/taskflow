import { updateTask, deleteTask } from "../../adapters/task-adapters";

function TaskItem({ task, loadTasks, onSelect }) {

  const handleChange = async (e) => {
    const { error } = await updateTask(task.task_id, {
      is_complete: e.target.checked,
    });

    if (error) return console.error(error);
    await loadTasks();
  };

  const handleDelete = async () => {
    const { error } = await deleteTask(task.task_id);
    if (error) return console.error(error);
    await loadTasks();
  };

  return (
    <li
      className={`
        flow-card p-5 hover-lift transition
        ${task.is_complete ? "opacity-60" : ""}
      `}
    >

      {/* MAIN */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-start gap-4 flex-1">

          <input
            type="checkbox"
            checked={task.is_complete}
            onChange={handleChange}
            className="mt-1 h-5 w-5 accent-cyan-400 cursor-pointer"
          />

          <div className="space-y-2">

            <h3
              className={`
                text-section leading-snug
                ${task.is_complete ? "line-through text-muted" : ""}
              `}
            >
              {task.title}
            </h3>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs uppercase tracking-wider bg-white/5 border border-white/10 text-muted">
              {task.priority || "medium"} priority
            </span>

          </div>

        </div>

        <button
          onClick={handleDelete}
          className="text-xs text-red-300 hover:text-red-200 transition"
        >
          Delete
        </button>

      </div>

      {/* ACTION */}
      <div className="flex justify-between pt-4">

        <button
          onClick={onSelect}
          className="btn-secondary text-xs"
        >
          ✨ Generate AI Plan
        </button>

      </div>

    </li>
  );
}

export default TaskItem;