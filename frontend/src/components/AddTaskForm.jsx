import { useState } from "react";

import { createTask } from "../adapters/task-adapters";

function AddTaskForm({ loadTasks }) {
  const [title, setTitle] = useState("");

  const [priority, setPriority] = useState("medium");

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsLoading(true);

    setErrorMessage(null);

    const taskData = {
      title,
      priority,
    };

    const { error } = await createTask(taskData);

    if (error) {
      setErrorMessage("Could not create task.");

      setIsLoading(false);

      return;
    }

    // 🔥 REFETCH TASKS
    await loadTasks();

    // 🔥 RESET FORM
    setTitle("");
    setPriority("medium");

    setIsLoading(false);
  };

  return (
    <div className="glass-card p-6 hover-lift fade-in">

      <h2 className="heading-flow text-glow mb-4">
        Create New Task
      </h2>

      {
        errorMessage && (
          <p className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            {errorMessage}
          </p>
        )
      }

      <form
        id="add-task-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* TASK TITLE */}
        <input
          type="text"
          name="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-flow"
        />

        {/* PRIORITY */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input-flow"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className="
  btn-flow
  w-full
  font-semibold
  hover-scale
"
        >
          {isLoading
            ? "Adding Task..."
            : "Add Task"}
        </button>
      </form>
    </div >
  );
}

export default AddTaskForm;