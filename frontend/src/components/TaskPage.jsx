import { useState, useEffect } from "react";
import { getTasks } from "../adapters/task-adapters";
import ExecutionBlock from "./task/ExecutionBlock";
import InsightBlock from "./task/InsightBlock";
import { LogOut } from "lucide-react";

function TaskPage({ currentUser, handleLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await getTasks();

    if (error) setError(error.message);
    else setTasks(data);

    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const completedTasks = tasks.filter(t => t.is_complete).length;
  const totalTasks = tasks.length;

  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <section className="dashboard-section space-y-8">

      {/* TOP BAR (NO BRANDING) */}
      <div className="flex items-center justify-between">

        <div className="space-y-1">
          <p className="text-muted text-sm">
            Welcome back, {currentUser.username}
          </p>
          <p className="text-body">
            Focus on execution and momentum
          </p>
        </div>

        <button onClick={handleLogout} className="btn-secondary">
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      {/* STATS CARD */}
      <div className="flow-card p-5 flex justify-between">
        <div>
          <p className="text-muted">Total Tasks</p>
          <h2 className="text-section">{totalTasks}</h2>
        </div>

        <div>
          <p className="text-muted">Completed</p>
          <h2 className="text-section">{completedTasks}</h2>
        </div>

        <div className="text-right">
          <p className="text-muted">Completion Rate</p>
          <h2 className="stat-number text-cyan-400">
            {completionRate}%
          </h2>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

        <div className="xl:col-span-8">
          <ExecutionBlock
            tasks={tasks}
            isLoading={isLoading}
            error={error}
            loadTasks={loadTasks}
            setSelectedTask={setSelectedTask}
          />
        </div>

        <div className="xl:col-span-4">
          <InsightBlock
            tasks={tasks}
            completedTasks={completedTasks}
            completionRate={completionRate}
            selectedTask={selectedTask}
          />
        </div>

      </div>

    </section>
  );
}

export default TaskPage;