import TaskItem from "./TaskItem";

function TaskList({ tasks, loadTasks, setSelectedTask }) {

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flow-card p-12 text-center space-y-4 hover-lift">

        <div className="text-3xl opacity-60">✦</div>

        <div className="space-y-2">
          <h3 className="text-title">No tasks yet</h3>
          <p className="text-body">
            Create your first task and start building momentum.
          </p>
        </div>

      </div>
    );
  }

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