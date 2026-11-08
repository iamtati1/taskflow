import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart3, CalendarRange, Info, ListChecks, Sparkles } from "lucide-react";

import useTasks from "../hooks/useTasks";
import TasksLoadState from "../components/tasks/TasksLoadState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressRing from "../components/ui/ProgressRing";
import { parseDueDate } from "../utils/dates";
import { EASE_OUT, rise, stagger } from "../utils/motion";

// Whole days from today to a due date (negative = overdue), or null
const daysUntil = (dueDate, today) => {
    const due = parseDueDate(dueDate);
    if (!due) return null;
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.round((due - start) / 86400000);
};

// Everything here comes from what each task stores today: its title,
// whether it's complete, and its due date
const analyse = (tasks, today = new Date()) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.is_complete).length;
    const open = tasks.filter((t) => !t.is_complete);
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const buckets = { overdue: 0, today: 0, week: 0, later: 0, none: 0 };
    const nextSeven = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        return { date, count: 0 };
    });

    for (const task of open) {
        const days = daysUntil(task.due_date, today);
        if (days === null) buckets.none += 1;
        else if (days < 0) buckets.overdue += 1;
        else if (days === 0) buckets.today += 1;
        else if (days < 7) buckets.week += 1;
        else buckets.later += 1;

        if (days !== null && days >= 0 && days < 7) nextSeven[days].count += 1;
    }

    return { total, completed, active: open.length, completionRate, buckets, nextSeven };
};

const HEALTH_ROWS = [
    { key: "overdue", label: "Overdue", bar: "bg-rose-400" },
    { key: "today", label: "Due today", bar: "bg-amber-400" },
    { key: "week", label: "This week", bar: "bg-cyan-400" },
    { key: "later", label: "Later", bar: "bg-violet-400" },
    { key: "none", label: "No due date", bar: "bg-white/30" },
];

function Analytics() {
    const navigate = useNavigate();
    const { tasks = [], status, error, refreshTasks } = useTasks();
    const metrics = useMemo(() => analyse(tasks), [tasks]);

    const reflection =
        metrics.completionRate >= 70
            ? { title: "Excellent momentum", desc: "You're consistently finishing the work you commit to." }
            : metrics.completionRate >= 40
                ? { title: "Steady progress", desc: "You're building a healthy rhythm. Keep closing tasks as you go." }
                : { title: "Building consistency", desc: "Small wins compound. Pick one open task and finish it next." };

    if (status === "loading" || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    const maxBucket = Math.max(1, ...Object.values(metrics.buckets));
    const maxDay = Math.max(1, ...metrics.nextSeven.map((d) => d.count));
    const busiest = metrics.nextSeven.reduce((best, d) => (d.count > best.count ? d : best), metrics.nextSeven[0]);

    return (
        <motion.section variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={rise} className="space-y-2">
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                    Analytics
                </h1>
                <p className="text-white/55">
                    How your work is going, from your {metrics.total} {metrics.total === 1 ? "task" : "tasks"} and their due dates.
                </p>
            </motion.div>

            {metrics.total === 0 ? (
                <motion.div variants={rise}>
                    <Card padding="xl" className="flex flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                            <BarChart3 size={26} aria-hidden="true" />
                        </div>
                        <h2 className="mt-5 text-xl font-semibold text-white">No data yet</h2>
                        <p className="mt-2 max-w-sm text-sm text-white/55">
                            Charts appear here once you have tasks. Add a few, with due dates, to see your week take shape.
                        </p>
                        <Button className="mt-6" onClick={() => navigate("/tasks", { state: { newTask: true } })}>
                            Add a task
                        </Button>
                    </Card>
                </motion.div>
            ) : (
                <>
                    {/* OVERVIEW */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                        <motion.div variants={rise}>
                            <Card className="flex h-full flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
                                <ProgressRing value={metrics.completionRate} size={148} stroke={12} label="Completion rate" caption="complete" />
                                <dl className="grid w-full grid-cols-3 gap-3 text-center sm:text-left lg:text-center xl:text-left">
                                    {[
                                        ["Total", metrics.total, "text-white"],
                                        ["Completed", metrics.completed, "text-emerald-300"],
                                        ["Active", metrics.active, "text-cyan-300"],
                                    ].map(([label, value, tone]) => (
                                        <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                                            <dt className="text-xs text-white/50">{label}</dt>
                                            <dd className={`mt-1 font-display text-2xl font-bold ${tone}`}>
                                                <AnimatedNumber value={value} />
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </Card>
                        </motion.div>

                        {/* DUE DATE HEALTH */}
                        <motion.div variants={rise}>
                            <Card className="h-full">
                                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                                    <ListChecks size={16} aria-hidden="true" />
                                    Open tasks by due date
                                </h2>
                                <ul className="mt-5 space-y-3.5">
                                    {HEALTH_ROWS.map(({ key, label, bar }, i) => (
                                        <li key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
                                            <span className="text-white/65">{label}</span>
                                            <span className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                                                <motion.span
                                                    className={`block h-full origin-left rounded-full ${bar}`}
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: metrics.buckets[key] / maxBucket }}
                                                    transition={{ duration: 0.8, delay: 0.15 + i * 0.07, ease: EASE_OUT }}
                                                />
                                            </span>
                                            <span className="tabular text-right font-semibold text-white">
                                                {metrics.buckets[key]}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </motion.div>
                    </div>

                    {/* NEXT 7 DAYS */}
                    <motion.div variants={rise}>
                        <Card>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
                                    <CalendarRange size={16} aria-hidden="true" />
                                    The next 7 days
                                </h2>
                                <p className="text-sm text-white/50">
                                    {busiest.count > 0
                                        ? `Busiest: ${busiest === metrics.nextSeven[0] ? "today" : busiest.date.toLocaleDateString(undefined, { weekday: "long" })} (${busiest.count} ${busiest.count === 1 ? "task" : "tasks"})`
                                        : "Nothing due this week"}
                                </p>
                            </div>

                            <ul className="mt-6 grid h-48 grid-cols-7 items-end gap-2 sm:gap-4">
                                {metrics.nextSeven.map(({ date, count }, i) => {
                                    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
                                    const fullDay = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
                                    return (
                                        <li key={i} className="flex h-full flex-col items-center justify-end gap-2">
                                            <span className="sr-only">{fullDay}: {count} {count === 1 ? "task" : "tasks"} due</span>
                                            <span aria-hidden="true" className="tabular text-xs font-semibold text-white/70">{count}</span>
                                            <motion.span
                                                aria-hidden="true"
                                                className={`w-full max-w-12 origin-bottom rounded-t-lg ${i === 0 ? "bg-gradient-to-t from-amber-500/60 to-amber-300" : "bg-gradient-to-t from-cyan-500/40 to-cyan-300"}`}
                                                // Up to 70% of the column: the count and day label need the rest
                                                style={{ height: `${Math.max(3, (count / maxDay) * 70)}%` }}
                                                initial={{ scaleY: 0 }}
                                                animate={{ scaleY: 1 }}
                                                transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: EASE_OUT }}
                                            />
                                            <span aria-hidden="true" className={`text-xs ${i === 0 ? "font-semibold text-amber-200" : "text-white/50"}`}>
                                                {i === 0 ? "Today" : dayName}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </Card>
                    </motion.div>

                    {/* REFLECTION */}
                    <motion.div variants={rise}>
                        <Card variant="subtle" className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                                <Sparkles size={18} aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{reflection.title}</h2>
                                <p className="mt-1 text-white/60">{reflection.desc}</p>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.p variants={rise} className="flex items-start gap-2 text-sm text-white/50">
                        <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                        Trends over time (when tasks were created and finished) will appear once tasks record those dates.
                    </motion.p>
                </>
            )}
        </motion.section>
    );
}

export default Analytics;
