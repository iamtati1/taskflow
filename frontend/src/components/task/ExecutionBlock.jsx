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
        <div className="space-y-6">

            {/* SECTION LABEL ONLY (NO APP-FEEL TITLE) */}
            <div className="space-y-1">
                <p className="text-muted uppercase tracking-wider">
                    Execution Zone
                </p>
            </div>

            {/* CREATE TASK FORM */}
            <div className="flow-card p-6 hover-lift">
                <AddTaskForm loadTasks={loadTasks} />
            </div>

            {/* LOADING */}
            {isLoading && (
                <div className="flex items-center gap-3 text-muted animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <p>Loading your workflow...</p>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="flow-card border border-red-500/20 bg-red-500/10 text-red-300 p-4">
                    {error}
                </div>
            )}

            {/* TASK LIST */}
            <div className="flow-card p-6 hover-lift">
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