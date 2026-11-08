import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, BarChart3, CalendarRange, CheckCircle2, Info, ListChecks, Target } from "lucide-react";

import useTasks from "../hooks/useTasks";
import TasksLoadState from "../components/tasks/TasksLoadState";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressRing from "../components/ui/ProgressRing";
import SectionHeader from "../components/ui/SectionHeader";
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

// Status colours where a bucket has a meaning (rose overdue, amber today);
// the theme's brand light for the rest, so each theme colours its charts
const HEALTH_ROWS = [
    { key: "overdue", label: "Overdue", bar: "from-rose-500/70 to-rose-400" },
    { key: "today", label: "Due today", bar: "from-amber-500/70 to-amber-300" },
    { key: "week", label: "This week", bar: "from-brand-a/60 to-brand-a" },
    { key: "later", label: "Later", bar: "from-brand-c/60 to-brand-c" },
    { key: "none", label: "No due date", bar: "from-white/20 to-white/35" },
];

// A closing note from the current numbers only. Tasks don't record when
// they were finished yet, so nothing here claims a habit or a trend.
const summarise = ({ total, completed, completionRate, buckets }) => {
    const finished = `You've completed ${completed} of your ${total} ${total === 1 ? "task" : "tasks"}.`;
    if (buckets.overdue > 0)
        return {
            tone: "rose",
            title: "Start with what's overdue",
            desc: `${finished} ${buckets.overdue} open ${buckets.overdue === 1 ? "task is" : "tasks are"} past due; clearing ${buckets.overdue === 1 ? "it" : "them"} first will help most.`,
        };
    if (completionRate === 100)
        return { tone: "emerald", title: "Everything is done", desc: `${finished} A good moment to plan what's next.` };
    if (completionRate >= 70)
        return { tone: "emerald", title: "Most of your list is done", desc: `${finished} Only a few remain.` };
    if (completionRate >= 40)
        return { tone: "brand", title: "Steady progress", desc: `${finished} Keep closing tasks as you go.` };
    return { tone: "brand", title: "Plenty still open", desc: `${finished} Pick one open task and finish it next.` };
};

const SUMMARY_TONES = {
    rose: { icon: AlertCircle, tile: "bg-rose-500/12 text-rose-300" },
    emerald: { icon: CheckCircle2, tile: "bg-emerald-400/12 text-emerald-300" },
    brand: { icon: Target, tile: "bg-brand-c/12 text-brand-c" },
};

function Analytics() {
    const navigate = useNavigate();
    const { tasks = [], status, error, refreshTasks } = useTasks();
    const metrics = useMemo(() => analyse(tasks), [tasks]);

    const summary = summarise(metrics);
    const { icon: SummaryIcon, tile: summaryTile } = SUMMARY_TONES[summary.tone];

    if (status === "loading" || error) {
        return <TasksLoadState status={status} error={error} onRetry={refreshTasks} />;
    }

    const maxBucket = Math.max(1, ...Object.values(metrics.buckets));
    const maxDay = Math.max(1, ...metrics.nextSeven.map((d) => d.count));
    const busiest = metrics.nextSeven.reduce((best, d) => (d.count > best.count ? d : best), metrics.nextSeven[0]);
    const busiestIndex = busiest.count > 0 ? metrics.nextSeven.indexOf(busiest) : -1;

    return (
        <motion.section variants={stagger()} initial="hidden" animate="show" className="space-y-6">

            {/* HEADER */}
            <motion.div variants={rise} className="space-y-2">
                <h1 className="text-3xl font-bold text-white sm:text-4xl">
                    Analytics
                </h1>
                <p className="text-white/60">
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
                            <Card className="flex h-full flex-col items-center justify-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
                                <ProgressRing value={metrics.completionRate} size={148} stroke={12} label="Completion rate" caption="complete" />
                                <dl className="grid w-full grid-cols-3 gap-3 text-center sm:text-left lg:text-center xl:text-left">
                                    {[
                                        ["Total", metrics.total, "text-white"],
                                        ["Completed", metrics.completed, "text-emerald-300"],
                                        ["Active", metrics.active, "text-cyan-300"],
                                    ].map(([label, value, tone]) => (
                                        <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                                            <dt className="text-xs text-white/60">{label}</dt>
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
                                <SectionHeader icon={ListChecks} count={metrics.active}>
                                    Open tasks by due date
                                </SectionHeader>
                                <ul className="mt-5 space-y-3.5">
                                    {HEALTH_ROWS.map(({ key, label, bar }, i) => (
                                        <li key={key} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
                                            <span className="text-white/65">{label}</span>
                                            <span className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                                                <motion.span
                                                    className={`block h-full origin-left rounded-full bg-gradient-to-r ${bar}`}
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
                                <SectionHeader icon={CalendarRange}>The next 7 days</SectionHeader>
                                <p className="text-sm text-white/60">
                                    {busiest.count > 0
                                        ? `Busiest: ${busiest === metrics.nextSeven[0] ? "today" : busiest.date.toLocaleDateString(undefined, { weekday: "long" })} (${busiest.count} ${busiest.count === 1 ? "task" : "tasks"})`
                                        : "Nothing due this week"}
                                </p>
                            </div>

                            {/* Faint guide lines behind the bars */}
                            <div className="relative mt-6">
                                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[22%] bottom-9 flex flex-col justify-between">
                                    {[0, 1, 2].map((line) => (
                                        <span key={line} className="border-t border-dashed border-white/[0.06]" />
                                    ))}
                                </div>
                                <ul className="relative grid h-52 grid-cols-7 items-end gap-2 sm:gap-4">
                                    {metrics.nextSeven.map(({ date, count }, i) => {
                                        const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
                                        const fullDay = date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
                                        const isBusiest = i === busiestIndex;
                                        // Today is amber (its status colour); other days use the theme's brand light
                                        const fill = i === 0
                                            ? "from-amber-500/50 to-amber-300"
                                            : count === 0
                                                ? "from-white/[0.06] to-white/[0.12]"
                                                : "from-brand-a/35 to-brand-a";
                                        return (
                                            <li key={i} className="flex h-full flex-col items-center justify-end gap-2">
                                                <span className="sr-only">{fullDay}: {count} {count === 1 ? "task" : "tasks"} due</span>
                                                <span aria-hidden="true" className={`tabular text-xs font-semibold ${isBusiest ? "text-white" : "text-white/70"}`}>{count}</span>
                                                <motion.span
                                                    aria-hidden="true"
                                                    className={`w-full max-w-12 origin-bottom rounded-t-lg bg-gradient-to-t ${fill}
                                                        ${isBusiest ? "shadow-[0_0_22px_-4px_var(--brand-a)] ring-1 ring-white/25" : ""}`}
                                                    // Up to 70% of the column: the count and day label need the rest
                                                    style={{ height: `${Math.max(3, (count / maxDay) * 70)}%` }}
                                                    initial={{ scaleY: 0 }}
                                                    animate={{ scaleY: 1 }}
                                                    transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: EASE_OUT }}
                                                />
                                                <span aria-hidden="true" className={`text-xs ${i === 0 ? "font-semibold text-amber-200" : isBusiest ? "font-semibold text-white" : "text-white/60"}`}>
                                                    {i === 0 ? "Today" : dayName}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </Card>
                    </motion.div>

                    {/* REFLECTION */}
                    <motion.div variants={rise}>
                        <Card className="flex items-start gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${summaryTile}`}>
                                <SummaryIcon size={18} aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">{summary.title}</h2>
                                <p className="mt-1 text-white/70">{summary.desc}</p>
                            </div>
                        </Card>
                    </motion.div>

                    <motion.p variants={rise} className="flex items-start gap-2 text-sm text-white/60">
                        <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                        Trends over time (when tasks were created and finished) will appear once tasks record those dates.
                    </motion.p>
                </>
            )}
        </motion.section>
    );
}

export default Analytics;
