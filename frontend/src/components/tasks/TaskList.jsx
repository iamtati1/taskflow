import TaskItem from "./TaskItem";

function TaskList({
    tasks = [],
    onDelete,
    onToggle,
    onSelect,
    onEdit,
    selectedTaskId,
}) {
    console.log("🔥 TASKS:", tasks);

    if (!Array.isArray(tasks)) return null;

    return (
        <ul className="space-y-3">
            {tasks.map((task) => {
                if (!task) return null;

                return (
                    <TaskItem
                        key={task.id}
                        task={task}
                        onDelete={() => onDelete(task.id)}
                        onToggle={() => onToggle(task.id)}
                        onSelect={() => onSelect(task.id)}
                        onEdit={(updates) => onEdit(task.id, updates)}
                        isSelected={selectedTaskId === task.id}
                    />
                );
            })}
        </ul>
    );
}

export default TaskList;