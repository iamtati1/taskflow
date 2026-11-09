import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";

import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import DueChip from "../tasks/DueChip";
import { dueStatus } from "../../utils/dates";
import { listItem } from "../../utils/motion";

// Rows take the tint of their due date: rose when overdue, amber today
const ROWS = {
    overdue: "border-rose-400/20 bg-rose-500/[0.06]",
    today: "border-amber-400/20 bg-amber-400/[0.05]",
};
const ROW = "border-white/[0.07] bg-white/[0.03]";

// Open tasks with a due date, most urgent first. `tasks` is already sorted;
// the first `limit` are listed, with a link to the rest.
function UpcomingTasks({ tasks, limit = 5 }) {
    const shown = tasks.slice(0, limit);
    const more = tasks.length - shown.length;

    return (
        <Card className="h-full">
            <SectionHeader icon={CalendarDays} count={tasks.length || undefined}>
                Upcoming Tasks
            </SectionHeader>

            {shown.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-white/60">
                    No upcoming tasks scheduled. Give a task a due date to see it here.
                </div>
            ) : (
                <ul className="mt-4 space-y-2">
                    <AnimatePresence initial={false}>
                        {shown.map((task) => (
                            <motion.li
                                key={task.task_id}
                                layout="position"
                                {...listItem}
                                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${ROWS[dueStatus(task.due_date)?.kind] ?? ROW}`}
                            >
                                <p className="min-w-0 break-words font-medium text-white">
                                    {task.title}
                                </p>
                                <DueChip dueDate={task.due_date} time={task.scheduled_time} />
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}

            {more > 0 && (
                <Link
                    to="/tasks"
                    className="mt-3 inline-flex min-h-9 touch:min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-cyan-300 transition-colors hover:bg-white/[0.05] hover:text-cyan-200"
                >
                    {more} more in Tasks
                    <ArrowRight size={14} aria-hidden="true" />
                </Link>
            )}
        </Card>
    );
}

export default UpcomingTasks;
