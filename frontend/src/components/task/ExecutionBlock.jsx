import AddTaskForm from "../AddTaskForm";
import TaskList from "./TaskList";

function ExecutionBlock({
    tasks,
    isLoading,
    error,
    loadTasks,
    setSelectedTask,
}) {
    return (
        <div className="dashboard-section pr-2">

            {/* =========================
          CREATE TASK CARD
      ========================= */}
            <div className="flow-card p-7 space-y-5 hover-lift">

                <div className="space-y-1">
                    <p className="text-muted uppercase tracking-[0.3em]">
                        Execution Zone
                    </p>

                    <h2 className="text-title text-cyan-300">
                        Create Task
                    </h2>
                </div>

                <AddTaskForm loadTasks={loadTasks} />
            </div>

            {/* =========================
          STATES
      ========================= */}
            {isLoading && (
                <div className="flex items-center gap-3 text-muted animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <p>Loading your workflow...</p>
                </div>
            )}

            {error && (
                <div className="flow-card border border-red-500/20 bg-red-500/10 text-red-300 p-4">
                    {error}
                </div>
            )}

            {/* =========================
          TASK LIST
      ========================= */}
            <div className="flow-card p-7 space-y-5 hover-lift">
                <TaskList
                    tasks={tasks}
                    loadTasks={loadTasks}
                    setSelectedTask={setSelectedTask}
                />
            </div>

        </div>
    );
}

export default ExecutionBlock;