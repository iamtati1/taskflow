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

    const { error } = await createTask({ title, priority });

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
    <div className="space-y-4">

      {/* ERROR ONLY */}
      {errorMessage && (
        <div className="flow-card border border-red-500/20 bg-red-500/10 text-red-300 p-3">
          {errorMessage}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
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
          className={`btn-flow w-full ${isLoading ? "opacity-50" : ""}`}
        >
          {isLoading ? "Adding Task..." : "Add Task"}
        </button>

      </form>
    </div>
  );
}

export default AddTaskForm;