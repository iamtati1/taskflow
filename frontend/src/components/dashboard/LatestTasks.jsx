import { CheckCircle2, Circle, ListTodo } from "lucide-react";

import Card from "../ui/Card";
import DueChip from "../tasks/DueChip";

// Newest first. Task ids grow as tasks are created, so id order is creation
// order; tasks don't record when they were created or completed yet, so this
// lists tasks rather than claiming to show recent activity
export const latestTasks = (tasks, limit = 5) =>
    tasks
        .filter((task) => Number.isFinite(Number(task.task_id)))
        .sort((a, b) => Number(b.task_id) - Number(a.task_id))
        .slice(0, limit);

function LatestTasks({ tasks = [] }) {
    const latest = latestTasks(tasks);

    return (
        <Card>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <ListTodo size={16} aria-hidden="true" />
                Latest tasks
            </h2>

            {latest.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/50">
                    No tasks yet. New tasks will show up here.
                </div>
            ) : (
                <ul className="mt-4 space-y-2">
                    {latest.map((task) => {
                        const Icon = task.is_complete ? CheckCircle2 : Circle;

                        return (
                            <li
                                key={task.task_id}
                                className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                            >
                                <Icon
                                    size={18}
                                    aria-hidden="true"
                                    className={`mt-0.5 shrink-0 ${task.is_complete ? "text-emerald-400" : "text-white/30"}`}
                                />

                                <div className="min-w-0 space-y-1.5">
                                    <p
                                        className={`break-words font-medium ${task.is_complete ? "text-white/50 line-through" : "text-white"}`}
                                    >
                                        {task.title}
                                    </p>

                                    {task.is_complete ? (
                                        <p className="text-xs font-medium text-emerald-300">Done</p>
                                    ) : task.due_date ? (
                                        <DueChip dueDate={task.due_date} />
                                    ) : (
                                        <p className="text-xs text-white/50">No due date</p>
                                    )}
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
