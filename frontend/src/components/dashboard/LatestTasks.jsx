import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, ListTodo } from "lucide-react";

import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import DueChip from "../tasks/DueChip";
import { listItem } from "../../utils/motion";

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
        <Card className="h-full">
            <SectionHeader icon={ListTodo}>Latest tasks</SectionHeader>

            {latest.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/60">
                    No tasks yet. New tasks will show up here.
                </div>
            ) : (
                <ul className="mt-4 space-y-2">
                    <AnimatePresence initial={false}>
                        {latest.map((task) => {
                            const Icon = task.is_complete ? CheckCircle2 : Circle;

                            return (
                                <motion.li
                                    key={task.task_id}
                                    layout="position"
                                    {...listItem}
                                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors duration-300
                                        ${task.is_complete ? "border-white/[0.05] bg-white/[0.015]" : "border-white/[0.07] bg-white/[0.03]"}`}
                                >
                                    <Icon
                                        size={18}
                                        aria-hidden="true"
                                        className={`mt-0.5 shrink-0 ${task.is_complete ? "text-emerald-400" : "text-white/30"}`}
                                    />

                                    <div className="min-w-0 space-y-1.5">
                                        <p
                                            className={`break-words font-medium ${task.is_complete ? "text-white/60 line-through decoration-white/30" : "text-white"}`}
                                        >
                                            {task.title}
                                        </p>

                                        {task.is_complete ? (
                                            <p className="text-xs font-medium text-emerald-300">Done</p>
                                        ) : task.due_date ? (
                                            <DueChip dueDate={task.due_date} />
                                        ) : (
                                            <p className="text-xs text-white/55">No due date</p>
                                        )}
                                    </div>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </Card>
    );
}

export default LatestTasks;
