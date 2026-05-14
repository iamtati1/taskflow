import { createTask } from '../adapters/task-adapters';

function AddTaskForm({ loadTasks }) {
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const title = form.elements.title.value;

    if (!title) return;

    const { error } = await createTask(title);

    if (error) return console.error(error);

    await loadTasks();

    form.reset();
  };

  return (
    <form id="add-task-form" onSubmit={handleSubmit}>
      <label htmlFor="title-input">New Task:</label>

      <input
        type="text"
        name="title"
        id="title-input"
        placeholder="What needs to be done?"
      />

      <button type="submit">Add</button>
    </form>
  );
}

export default AddTaskForm;