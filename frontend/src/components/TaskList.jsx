import TaskItem from './TaskItem';

function TaskList({ tasks, loadTasks }) {
  return (
    <ul id="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.task_id}
          task={task}
          loadTasks={loadTasks}
        />
      ))}
    </ul>
  );
}

export default TaskList;
