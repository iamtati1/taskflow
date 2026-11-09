import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import { countLabel } from "./MonthView";
import { addDays, addMonths, dayLabel, monthWeeks, sameMonth, tasksByDay, weekdayNames } from "../../utils/calendar";
import { isOverdue, toDateKey } from "../../utils/dates";

// A small month at a glance (Dashboard, beside the task list): a dot marks
// days with tasks, rose when one is overdue. Each day links to that day on
// the Calendar page.
function CalendarWidget({ tasks = [] }) {
    const today = toDateKey(new Date());
    const [month, setMonth] = useState(today);
    const days = useMemo(() => tasksByDay(tasks), [tasks]);
    const names = weekdayNames("narrow");
    const longNames = weekdayNames("long");

    const weekEnd = addDays(today, 6);
    const thisWeek = tasks.filter((task) => {
        const key = toDateKey(task.due_date);
        return !task.is_complete && key && key >= today && key <= weekEnd;
    }).length;

    const label = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
        .toLocaleDateString(undefined, { month: "long", year: "numeric" });

    return (
        <Card className="h-full">
            <SectionHeader
                icon={CalendarDays}
                action={
                    <Link
                        to="/calendar"
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-sm text-cyan-300 transition-colors hover:bg-white/[0.05] hover:text-cyan-200 touch:min-h-11"
                    >
                        Open calendar
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                }
            >
                Calendar
            </SectionHeader>

            <div className="mt-4 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setMonth(addMonths(month, -1))}
                    aria-label="Previous month"
                    className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white inline-flex items-center justify-center touch:min-h-11 touch:min-w-11"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <p aria-live="polite" className="text-sm font-semibold text-white">{label}</p>
                <button
                    type="button"
                    onClick={() => setMonth(addMonths(month, 1))}
                    aria-label="Next month"
                    className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white inline-flex items-center justify-center touch:min-h-11 touch:min-w-11"
                >
                    <ChevronRight size={16} aria-hidden="true" />
                </button>
            </div>

            <table className="mt-2 w-full table-fixed">
                <caption className="sr-only">{label}</caption>
                <thead>
                    <tr>
                        {names.map((name, i) => (
                            <th key={longNames[i]} scope="col" abbr={longNames[i]} className="pb-1 text-xs font-medium text-white/45">
                                {name}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {monthWeeks(month).map((week) => (
                        <tr key={week[0]}>
                            {week.map((day) => {
                                const dayTasks = days.get(day) ?? [];
                                const open = dayTasks.filter((task) => !task.is_complete);
                                const late = open.some((task) => isOverdue(task.due_date));
                                const isToday = day === today;
                                return (
                                    <td key={day} className="p-0.5 text-center">
                                        <Link
                                            to={`/calendar?view=day&date=${day}`}
                                            aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}${countLabel(dayTasks)}`}
                                            aria-current={isToday ? "date" : undefined}
                                            className={`tabular relative mx-auto flex h-9 w-full max-w-10 flex-col items-center justify-center rounded-lg text-xs transition-colors touch:h-11
                                                ${isToday ? "bg-cyan-400/15 font-semibold text-cyan-100 ring-1 ring-cyan-300/60" : "hover:bg-white/[0.06]"}
                                                ${sameMonth(day, month) ? (isToday ? "" : "text-white/80") : "text-white/30"}`}
                                        >
                                            {Number(day.slice(8))}
                                            {dayTasks.length > 0 && (
                                                <span
                                                    aria-hidden="true"
                                                    className={`absolute bottom-1 h-1 w-1 rounded-full ${open.length === 0 ? "bg-white/30" : late ? "bg-rose-400" : "bg-cyan-300"}`}
                                                />
                                            )}
                                        </Link>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="mt-3 text-sm text-white/60">
                {thisWeek === 0
                    ? "Nothing due in the next 7 days."
                    : <><span className="tabular font-semibold text-white">{thisWeek}</span> {thisWeek === 1 ? "task" : "tasks"} due in the next 7 days</>}
            </p>
        </Card>
    );
}

export default CalendarWidget;
