import { useState, useEffect } from 'react';
import { getTasks } from '../adapters/task-adapters';

import AddTaskForm from './AddTaskForm';
import TaskList from './TaskList';
import MotivationalCard from "./MotivationalCard";
import AnalyticsPanel from './AnalyticsPanel';
import AIPlanCard from './AIPlanCard';

function TaskPage({ currentUser, handleLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks
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

  // analytics
  const completedTasks = tasks.filter(t => t.is_complete).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  return (
    <section className="relative min-h-screen text-white overflow-hidden">

      {/* subtle background depth */}
      <div className="absolute inset-0 bg-drift">
        <div className="bg-glow w-[400px] h-[400px] bg-cyan-500 top-[-120px] left-[-120px]" />
        <div className="bg-glow w-[500px] h-[500px] bg-violet-500 bottom-[-150px] right-[-150px]" />
      </div>

      {/* centered layout */}
      <div className="relative z-10 container-flow space-y-6">

        {/* USER BAR */}
        <div className="glass-card p-4 flex items-center justify-between">
          <span className="text-sm text-zinc-300">
            Welcome,{" "}
            <span className="text-white font-semibold">
              {currentUser.username}
            </span>
          </span>

          <button
            onClick={handleLogout}
            className="btn-flow text-sm"
          >
            Log Out
          </button>
        </div>

        {/* ADD TASK */}
        <div className="glass-card p-4">
          <AddTaskForm loadTasks={loadTasks} />
        </div>

        {/* LOADING / ERROR */}
        {isLoading && (
          <p className="text-zinc-400">Loading tasks...</p>
        )}

        {error && (
          <p className="text-red-400">
            Something went wrong: {error}
          </p>
        )}

        {/* MOTIVATION */}
        <MotivationalCard tasks={tasks} />

        {/* ANALYTICS */}
        <AnalyticsPanel
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          completionRate={completionRate}
        />

        {/* TASKS */}
        <div className="glass-card p-4">
          <TaskList
            tasks={tasks}
            loadTasks={loadTasks}
            setSelectedTask={setSelectedTask}
          />
        </div>

        {/* AI */}
        <AIPlanCard task={selectedTask} />

      </div>
    </section >
  );
}

export default TaskPage;