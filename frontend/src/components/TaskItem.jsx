import { updateTask, deleteTask } from '../adapters/task-adapters';

function TaskItem({ task, loadTasks }) {
  const handleChange = async (e) => {
    const { error } = await updateTask(task.task_id, {
      is_complete: e.target.checked,
    });

    if (error) return console.error(error);

    loadTasks();
  };

  const handleDelete = async () => {
    const { error } = await deleteTask(task.task_id);

    if (error) return console.error(error);

    loadTasks();
  };

  return (
    <li className="task-item">
      <input
        type="checkbox"
        checked={task.is_complete}
        onChange={handleChange}
      />

      <span className={task.is_complete ? 'completed' : ''}>
        {task.title}
      </span>

      <button className="delete-btn" onClick={handleDelete}>
        Delete
      </button>
    </li>
  );
}

export default TaskItem;