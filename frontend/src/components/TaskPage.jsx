import { useState, useEffect } from "react";
import { getTasks } from "../adapters/task-adapters";
import ExecutionBlock from "./task/ExecutionBlock";
import InsightBlock from "./task/InsightBlock";
import { LayoutDashboard, LogOut } from "lucide-react";

function TaskPage({ currentUser, handleLogout }) {
  // =========================
  // STATE
  // =========================
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // =========================
  // DATA FETCH
  // =========================
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

  // =========================
  // DERIVED STATE
  // =========================
  const completedTasks = tasks.filter((t) => t.is_complete).length;
  const totalTasks = tasks.length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // =========================
  // STATS SECTION
  // =========================
  const StatsStrip = () => (
    <section className="dashboard-grid">
      <div className="flow-card p-6 hover-lift">
        <p className="stat-label">Total Tasks</p>
        <h3 className="stat-number">{totalTasks}</h3>
      </div>

      <div className="flow-card p-6 hover-lift">
        <p className="stat-label">Completed</p>
        <h3 className="stat-number text-cyan-400">{completedTasks}</h3>
      </div>

      <div className="flow-card p-6 hover-lift">
        <p className="stat-label">Productivity Score</p>
        <h3 className="stat-number text-violet-300">
          {completionRate}%
        </h3>
      </div>
    </section>
  );

  // =========================
  // HERO SECTION
  // =========================
  const HeroSection = () => (
    <section className="dashboard-section">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-cyan-400" />
            <h1 className="text-hero heading-flow">
              Flow Dashboard
            </h1>
          </div>

          <p className="text-body mt-2 max-w-xl">
            Organize priorities, build momentum, and execute consistently.
          </p>
        </div>

        <button onClick={handleLogout} className="btn-secondary">
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      <div className="flow-card p-5 flex items-center justify-between">
        <div>
          <p className="text-muted uppercase tracking-wider">
            Logged in as
          </p>
          <h2 className="text-section mt-1">
            {currentUser.username}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-muted uppercase tracking-wider">
            Completion Rate
          </p>
          <h2 className="stat-number text-cyan-400">
            {completionRate}%
          </h2>
        </div>
      </div>
    </section>
  );

  // =========================
  // MAIN UI
  // =========================
  return (
    <section className="min-h-screen relative overflow-hidden">
      {/* background glow */}
      <div className="bg-glow w-96 h-96 bg-cyan-500 top-0 left-1/3" />
      <div className="bg-glow w-96 h-96 bg-violet-500 bottom-0 right-1/4" />

      <div className="container-flow dashboard-section">
        <HeroSection />

        <div className="divider" />

        <StatsStrip />

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-10 mt-6">
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
        </section>
      </div>
    </section>
  );
}

export default TaskPage;