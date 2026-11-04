import { expect, test } from "vitest";

import { formatDueDate, isOverdue, parseDueDate, toDateKey } from "./dates";

test("a YYYY-MM-DD due date is that local calendar day, whatever the time zone", () => {
    const date = parseDueDate("2026-11-20");
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 20, 0]);
    expect(toDateKey("2026-11-20")).toBe("2026-11-20");
    // A timestamp string from the database still means its calendar day
    expect(toDateKey("2026-11-20 00:00:00")).toBe("2026-11-20");
});

test("a Date (like a calendar selection) maps to its local day", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
});

test("empty or invalid values give null / empty output instead of Invalid Date", () => {
    expect(parseDueDate(null)).toBeNull();
    expect(toDateKey("not a date")).toBeNull();
    expect(formatDueDate(undefined)).toBe("");
});

test("overdue means before today; due today is not overdue", () => {
    const today = new Date(2026, 10, 20, 15, 0);
    expect(isOverdue("2026-11-19", today)).toBe(true);
    expect(isOverdue("2026-11-20", today)).toBe(false);
    expect(isOverdue("2026-11-21", today)).toBe(false);
    expect(isOverdue(null, today)).toBe(false);
});
