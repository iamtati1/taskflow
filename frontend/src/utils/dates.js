// Due dates travel as "YYYY-MM-DD": a calendar day with no time zone.
// new Date("2026-11-20") would mean midnight UTC, which is still the 19th in
// the Americas, so these helpers always work in the user's local days.

// "2026-11-20" (or a Date) -> a local Date at midnight, or null
export const parseDueDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

// A due date or Date -> "YYYY-MM-DD" in local time (comparable as a string), or null
export const toDateKey = (value) => {
    const date = parseDueDate(value);
    if (!date) return null;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
};

export const formatDueDate = (value, options) =>
    parseDueDate(value)?.toLocaleDateString(undefined, options) ?? "";

// Overdue means the due day is before today; a task due today is not overdue
export const isOverdue = (value, today = new Date()) => {
    const key = toDateKey(value);
    return key !== null && key < toDateKey(today);
};

// How a due date reads in the app, and how urgent it is:
// { kind: "overdue" | "today" | "tomorrow" | "later", text }, or null for no date
export const dueStatus = (value, today = new Date()) => {
    const key = toDateKey(value);
    if (!key) return null;

    const todayKey = toDateKey(today);
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const day = formatDueDate(value, { month: "short", day: "numeric" });

    if (key < todayKey) return { kind: "overdue", text: `Overdue · was due ${day}` };
    if (key === todayKey) return { kind: "today", text: "Due today" };
    if (key === toDateKey(tomorrow)) return { kind: "tomorrow", text: "Due tomorrow" };
    return { kind: "later", text: `Due ${day}` };
};

// A scheduled time ("14:30", 24-hour, no time zone) as the user's locale
// writes clock times ("2:30 PM"), or "" for none
export const formatTime = (value) => {
    const match = /^(\d{2}):(\d{2})/.exec(value ?? "");
    if (!match) return "";
    return new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
        .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

// A day `days` after today (or another date), as "YYYY-MM-DD"
export const daysFrom = (days, from = new Date()) =>
    toDateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days));
