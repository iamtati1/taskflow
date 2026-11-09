import { describe, expect, test } from "vitest";

import {
    addDays,
    addMonths,
    isDateKey,
    monthWeeks,
    startOfWeek,
    step,
    tasksByDay,
    viewHeading,
    weekDays,
} from "./calendar";

describe("calendar days", () => {
    test("days are added across month and year ends", () => {
        expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
        expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
        expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    });

    test("daylight-saving changes neither skip nor repeat a day", () => {
        // US clocks change on these Sundays; other zones have their own
        expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
        expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
        expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
        expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
        let day = "2026-01-01";
        for (let i = 0; i < 365; i += 1) day = addDays(day, 1);
        expect(day).toBe("2027-01-01");
    });

    test("months keep the day, or use the month's last day when it is shorter", () => {
        expect(addMonths("2026-11-08", 1)).toBe("2026-12-08");
        expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
        expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
        expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
        expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    });

    test("weeks run Sunday to Saturday", () => {
        expect(startOfWeek("2026-11-08")).toBe("2026-11-08"); // a Sunday
        expect(startOfWeek("2026-11-14")).toBe("2026-11-08");
        expect(weekDays("2026-12-31")).toEqual([
            "2026-12-27", "2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02",
        ]);
    });

    test("a month shows whole weeks from the week of the 1st to the week of the last day", () => {
        const weeks = monthWeeks("2026-11-20");
        expect(weeks).toHaveLength(5);
        expect(weeks[0][0]).toBe("2026-11-01");
        expect(weeks.at(-1).at(-1)).toBe("2026-12-05");
        expect(monthWeeks("2026-02-10")).toHaveLength(4); // Feb 2026 starts on a Sunday
        expect(monthWeeks("2026-08-10")).toHaveLength(6);
    });

    test("prev/next steps by the view's length", () => {
        expect(step("month", "2026-11-08", 1)).toBe("2026-12-08");
        expect(step("week", "2026-11-08", -1)).toBe("2026-11-01");
        expect(step("day", "2026-11-08", 1)).toBe("2026-11-09");
    });

    test("only real days are day keys", () => {
        expect(isDateKey("2026-11-08")).toBe(true);
        expect(isDateKey("2026-02-30")).toBe(false);
        expect(isDateKey("2026-11-8")).toBe(false);
        expect(isDateKey(null)).toBe(false);
    });

    test("headings name the month, the week's range or the day", () => {
        expect(viewHeading("month", "2026-11-08")).toMatch(/November 2026/);
        expect(viewHeading("week", "2026-11-10")).toMatch(/8.*14.*2026/);
        expect(viewHeading("day", "2026-11-10")).toMatch(/Tuesday.*November 10/);
    });
});

describe("tasks by day", () => {
    test("groups dated tasks by day: open first, untimed before timed, then by time", () => {
        const days = tasksByDay([
            { task_id: 1, title: "Late call", due_date: "2026-11-10", scheduled_time: "16:00" },
            { task_id: 2, title: "Done", due_date: "2026-11-10", is_complete: true },
            { task_id: 3, title: "Anytime", due_date: "2026-11-10" },
            { task_id: 4, title: "Early call", due_date: "2026-11-10T00:00:00.000Z", scheduled_time: "09:00" },
            { task_id: 5, title: "Someday", due_date: null },
        ]);
        expect([...days.keys()]).toEqual(["2026-11-10"]);
        expect(days.get("2026-11-10").map((t) => t.task_id)).toEqual([3, 4, 1, 2]);
    });
});
