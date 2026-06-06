import TaskItem from "./TaskItem";

function TaskList({
    tasks = [],
    onDelete,
    onToggle,
    onSelect,
    onEdit,
    selectedTaskId,
}) {
    if (!tasks?.length) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <h3 className="text-white font-medium">
                    No tasks yet
                </h3>
                <p className="text-white/50 text-sm mt-2">
                    Create your first task to get started
                </p>
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {tasks.map((task) => (
                <TaskItem
                    key={task.task_id}
                    task={task}
                    onDelete={onDelete}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    onEdit={onEdit}
                    isSelected={selectedTaskId === task.task_id}
                />
            ))}
        </ul>
    );
}

export default TaskList;