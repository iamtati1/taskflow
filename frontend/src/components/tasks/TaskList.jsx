import TaskItem from "./TaskItem";

function TaskList({
    tasks = [],
    onDelete,
    onToggle,
    onSelect,
    onEdit,
    selectedTaskId,
}) {
    if (!Array.isArray(tasks)) {
        console.warn("TaskList received invalid tasks:", tasks);
        return null;
    }

    if (tasks.length === 0) {
        return (
            <div className="rounded-3xl border border-white/10 p-8 text-center">
                <h3 className="text-lg font-medium text-white">
                    No tasks yet
                </h3>

                <p className="mt-2 text-white/60">
                    Create your first task to get started.
                </p>
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {tasks.map((task) => {
                if (!task?.task_id) {
                    console.warn("Invalid task:", task);
                    return null;
                }

                return (
                    <TaskItem
                        key={task.task_id}
                        task={task}
                        onDelete={onDelete}
                        onToggle={onToggle}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        isSelected={selectedTaskId === task.task_id}
                    />
                );
            })}
        </ul>
    );
}

export default TaskList;