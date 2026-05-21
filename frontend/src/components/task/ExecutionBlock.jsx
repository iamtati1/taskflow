function ExecutionBlock({
    tasks,
    isLoading,
    error,
    loadTasks,
    setSelectedTask,
}) {
    return (
        <div className="space-y-6">

            {/* SECTION LABEL */}
            <p className="text-muted uppercase tracking-wider">
                Execution Zone
            </p>

            {/* TASK CREATION */}
            <div className="flow-card p-6">
                <AddTaskForm loadTasks={loadTasks} />
            </div>

            {/* LOADING */}
            {isLoading && (
                <div className="text-muted animate-pulse">
                    Loading your workflow...
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="flow-card border border-red-500/20 bg-red-500/10 text-red-300 p-4">
                    {error}
                </div>
            )}

            {/* TASK LIST */}
            <div className="flow-card p-6">
                <TaskList
                    tasks={tasks}
                    loadTasks={loadTasks}
                    setSelectedTask={setSelectedTask}
                />
            </div>

        </div>
    );
}