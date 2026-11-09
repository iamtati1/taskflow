// Calendar arithmetic on "YYYY-MM-DD" day keys. Days are built from their
// year, month and day in local time (never by adding 24 hours), so a
// daylight-saving change can't skip or repeat a day.
import { parseDueDate, toDateKey } from "./dates";

export const VIEWS = ["month", "week", "day"];

// Weeks start on Sunday
const WEEK_START = 0;

const at = (key, years, months, days) => {
    const date = parseDueDate(key);
    return new Date(date.getFullYear() + years, date.getMonth() + months, date.getDate() + days);
};

export const isDateKey = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(value) === value;

export const addDays = (key, days) => toDateKey(at(key, 0, 0, days));

// The same day in another month, or that month's last day when it is
// shorter (Jan 31 + 1 month = Feb 28)
export const addMonths = (key, months) => {
    const date = parseDueDate(key);
    const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return toDateKey(new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay)));
};

export const startOfWeek = (key) => addDays(key, -((parseDueDate(key).getDay() - WEEK_START + 7) % 7));

export const sameMonth = (a, b) => a.slice(0, 7) === b.slice(0, 7);

// The 7 days of the week containing `key`
export const weekDays = (key) => {
    const start = startOfWeek(key);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// The weeks shown for the month containing `key`: whole weeks, from the
// week of the 1st to the week of the last day (4 to 6 rows)
export const monthWeeks = (key) => {
    const first = `${key.slice(0, 7)}-01`;
    const last = addDays(addMonths(first, 1), -1);
    const weeks = [];
    for (let day = startOfWeek(first); day <= last; day = addDays(day, 7)) {
        weeks.push(weekDays(day));
    }
    return weeks;
};

// One step back or forward in the current view
export const step = (view, key, direction) =>
    view === "month" ? addMonths(key, direction)
        : view === "week" ? addDays(key, 7 * direction)
            : addDays(key, direction);

// The short weekday names, in week order ("Sun", "Mon", ...)
export const weekdayNames = (style = "short") =>
    weekDays("2026-11-08").map((key) => parseDueDate(key).toLocaleDateString(undefined, { weekday: style }));

const format = (key, options) => parseDueDate(key).toLocaleDateString(undefined, options);

// The heading for a view: "November 2026", "Nov 8 – 14, 2026" or
// "Sunday, November 8, 2026"
export const viewHeading = (view, key) => {
    if (view === "month") return format(key, { month: "long", year: "numeric" });
    if (view === "day") return format(key, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const days = weekDays(key);
    const first = parseDueDate(days[0]);
    const last = parseDueDate(days[6]);
    try {
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).formatRange(first, last);
    } catch {
        return `${format(days[0], { month: "short", day: "numeric" })} – ${format(days[6], { month: "short", day: "numeric", year: "numeric" })}`;
    }
};

// A day's full name for labels: "Tuesday, November 10"
export const dayLabel = (key) => format(key, { weekday: "long", month: "long", day: "numeric" });

// Open tasks first; then tasks with no time ("any time"), then by time;
// then by title
export const byDayOrder = (a, b) =>
    Number(Boolean(a.is_complete)) - Number(Boolean(b.is_complete)) ||
    (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? "") ||
    String(a.title).localeCompare(String(b.title));

// Dated tasks grouped by day: Map("YYYY-MM-DD" -> tasks in day order).
// Undated tasks have no place on a calendar.
export const tasksByDay = (tasks) => {
    const days = new Map();
    for (const task of tasks) {
        const key = toDateKey(task?.due_date);
        if (!key) continue;
        if (!days.has(key)) days.set(key, []);
        days.get(key).push(task);
    }
    for (const list of days.values()) list.sort(byDayOrder);
    return days;
};
