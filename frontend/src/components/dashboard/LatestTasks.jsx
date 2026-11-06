import { CheckCircle2, Circle, ListTodo } from "lucide-react";

import Card from "../ui/Card";
import { formatDueDate, isOverdue } from "../../utils/dates";

// Newest first. Task ids grow as tasks are created, so id order is creation
// order; tasks don't record when they were created or completed yet, so this
// lists tasks rather than claiming to show recent activity
export const latestTasks = (tasks, limit = 5) =>
    tasks
        .filter((task) => Number.isFinite(Number(task.task_id)))
        .sort((a, b) => Number(b.task_id) - Number(a.task_id))
        .slice(0, limit);

const statusOf = (task) => {
    if (task.is_complete) return { label: "Done", className: "text-cyan-300" };
    if (!task.due_date) return { label: "No due date", className: "text-white/40" };

    const due = formatDueDate(task.due_date, { month: "short", day: "numeric" });
    return isOverdue(task.due_date)
        ? { label: `Overdue · was due ${due}`, className: "text-red-300" }
        : { label: `Due ${due}`, className: "text-white/50" };
};

function LatestTasks({ tasks = [] }) {
    const latest = latestTasks(tasks);

    return (
        <Card>
            <h2 className="flex items-center gap-2 text-base font-normal text-blue-300">
                <ListTodo size={18} aria-hidden="true" />
                Latest tasks
            </h2>

            {latest.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-white/50">
                    No tasks yet. New tasks will show up here.
                </div>
            ) : (
                <ul className="mt-5 space-y-3">
                    {latest.map((task) => {
                        const status = statusOf(task);
                        const Icon = task.is_complete ? CheckCircle2 : Circle;

                        return (
                            <li
                                key={task.task_id}
                                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                            >
                                <Icon
                                    size={18}
                                    aria-hidden="true"
                                    className={`mt-0.5 shrink-0 ${task.is_complete ? "text-cyan-300" : "text-white/30"}`}
                                />

                                <div className="min-w-0">
                                    <p
                                        className={`break-words font-medium ${task.is_complete ? "text-white/50 line-through" : "text-white"}`}
                                    >
                                        {task.title}
                                    </p>

                                    <p className={`mt-1 text-sm ${status.className}`}>
                                        {status.label}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

export default LatestTasks;
