import { useState, useEffect } from 'react';
import { getTasks } from '../adapters/task-adapters';

import AddTaskForm from './AddTaskForm';
import TaskList from "./TaskList";
import AnalyticsPanel from './AnalyticsPanel';
import MotivationalCard from './MotivationalCard';
import AIPlanCard from './AIPlanCard';

function TaskPage({ currentUser, handleLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await getTasks();

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

  const completedTasks = tasks.filter(t => t.is_complete).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <section className="min-h-screen space-y-8">

      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">
          Welcome {currentUser.username}
        </h1>

        <button onClick={handleLogout}>
          Log Out
        </button>
      </div>

      {/* LEFT + RIGHT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT */}
        <div className="xl:col-span-8 space-y-6">

          <AddTaskForm loadTasks={loadTasks} />

          {isLoading && <p className="text-zinc-400">Loading tasks...</p>}

          {error && <p className="text-red-400">{error}</p>}

          <TaskList
            tasks={tasks}
            loadTasks={loadTasks}
            setSelectedTask={setSelectedTask}
          />
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-4 space-y-6">

          <AnalyticsPanel
            totalTasks={totalTasks}
            completedTasks={completedTasks}
            completionRate={completionRate}
          />

          <MotivationalCard tasks={tasks} />

          <AIPlanCard task={selectedTask} />

        </div>

      </div>

    </section>
  );
}

export default TaskPage;