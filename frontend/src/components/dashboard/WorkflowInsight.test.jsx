import { expect, test } from "vitest";

import { insightFor } from "./WorkflowInsight";

const counts = (c) => ({ total: 0, active: 0, completed: 0, overdue: 0, dueToday: 0, ...c });

test("each note comes from today's counts, most pressing first", () => {
    expect(insightFor(counts({})).text).toMatch(/Add a few tasks/);
    expect(insightFor(counts({ total: 3, completed: 3 })).tone).toBe("emerald");
    expect(insightFor(counts({ total: 4, active: 3, completed: 1, overdue: 1, dueToday: 2 })).text)
        .toBe("1 task is overdue. Finishing or rescheduling it first will lighten everything else.");
    expect(insightFor(counts({ total: 4, active: 3, completed: 1, dueToday: 2 })).text)
        .toBe("2 tasks are due today. Clearing them keeps tomorrow free.");
    expect(insightFor(counts({ total: 5, active: 1, completed: 4 })).text).toMatch(/One task left/);
    expect(insightFor(counts({ total: 6, active: 2, completed: 4 })).text)
        .toBe("You've finished 4 of 6 tasks. Your workload looks balanced.");
    expect(insightFor(counts({ total: 6, active: 5, completed: 1 })).text).toMatch(/more open than finished/);
});
