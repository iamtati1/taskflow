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
