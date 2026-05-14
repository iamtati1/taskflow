import { useState, useEffect } from 'react';

import { fetchAllTasks } from '../adapters/task-adapters';

import AddTaskForm from './AddTaskForm';
import TaskList from './TaskList';

function TaskPage({ currentUser, handleLogout }) {
  const [tasks, setTasks] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState(null);

  // This helper fetches tasks on page load with useEffect
  // It is also used within the AddTaskForm and TaskList
  // to re-fetch tasks when a mutation action is performed
  // such as creating, deleting, or updating a task.
  const loadTasks = async () => {
    setIsLoading(true);

    setError(null);

    const { data, error: fetchError } = await fetchAllTasks();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTasks(data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <section>
      <div id="user-controls">
        <span>
          Welcome, <strong>{currentUser.username}</strong>!
        </span>

        <button onClick={handleLogout}>Log Out</button>
      </div>

      <AddTaskForm loadTasks={loadTasks} />

      {isLoading && <p>Loading tasks...</p>}

      {error && (
        <p className="error">
          Something went wrong: {error}
        </p>
      )}

      <TaskList tasks={tasks} loadTasks={loadTasks} />
    </section>
  );
}

export default TaskPage;