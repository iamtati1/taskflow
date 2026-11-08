import { expect, test } from "vitest";

import { dueStatus, formatDueDate, isOverdue, parseDueDate, toDateKey } from "./dates";

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

test("dueStatus labels a date by urgency, relative to today", () => {
    const today = new Date(2026, 10, 20); // Nov 20
    expect(dueStatus("2026-11-19", today)).toEqual({ kind: "overdue", text: "Overdue · was due Nov 19" });
    expect(dueStatus("2026-11-20", today)).toEqual({ kind: "today", text: "Due today" });
    expect(dueStatus("2026-11-21", today)).toEqual({ kind: "tomorrow", text: "Due tomorrow" });
    expect(dueStatus("2026-12-01", today)).toEqual({ kind: "later", text: "Due Dec 1" });
    expect(dueStatus(null, today)).toBeNull();
});

test("dueStatus handles month and year ends", () => {
    expect(dueStatus("2027-01-01", new Date(2026, 11, 31)).kind).toBe("tomorrow");
    expect(dueStatus("2026-12-31", new Date(2027, 0, 1)).kind).toBe("overdue");
});
