import TaskItem from "./TaskItem";

function TaskList({ tasks, loadTasks, setSelectedTask }) {
  // =========================
  // EMPTY STATE
  // =========================
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flow-card p-14 text-center relative overflow-hidden hover-lift">

        {/* background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5" />

        <div className="relative z-10 space-y-5">

          <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
            ✦
          </div>

          <div className="space-y-2">
            <h3 className="text-title">
              No tasks yet
            </h3>

            <p className="text-body max-w-sm mx-auto">
              Create your first task and begin building momentum toward your goals.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // =========================
  // TASK LIST
  // =========================
  return (
    <ul className="space-y-5">
      {tasks.map((task) => (
        <TaskItem
          key={task.task_id}
          task={task}
          loadTasks={loadTasks}
          onSelect={() => setSelectedTask(task)}
        />
      ))}
    </ul>
  );
}

export default TaskList;