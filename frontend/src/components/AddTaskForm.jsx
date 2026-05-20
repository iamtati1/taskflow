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

    const taskData = { title, priority };

    const { error } = await createTask(taskData);

    if (error) {
      setErrorMessage("Could not create task.");
      setIsLoading(false);
      return;
    }

    await loadTasks();

    setTitle("");
    setPriority("medium");
    setIsLoading(false);
  };

  return (
    <div className="flow-card p-6 space-y-5 hover-lift fade-in">

      {/* HEADER */}
      <div className="space-y-1">
        <h2 className="text-title text-cyan-300">
          Create New Task
        </h2>

        <p className="text-muted">
          Add a task to your workflow
        </p>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="flow-card border border-red-500/20 bg-red-500/10 text-red-300 p-3">
          {errorMessage}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-flow"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input-flow"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button
          type="submit"
          disabled={isLoading}
          className={`btn-flow w-full hover-scale ${isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {isLoading ? "Adding Task..." : "Add Task"}
        </button>

      </form>
    </div>
  );
}

export default AddTaskForm;