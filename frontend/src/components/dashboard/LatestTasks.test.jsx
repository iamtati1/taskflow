// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import LatestTasks, { latestTasks } from "./LatestTasks";
import { toDateKey } from "../../utils/dates";

afterEach(cleanup);

const task = (task_id, title, extra = {}) => ({
    task_id,
    title,
    is_complete: false,
    due_date: null,
    ...extra,
});

test("newest first by id, at most five", () => {
    const tasks = [1, 7, 3, 12, 5, 9].map((id) => task(id, `Task ${id}`));

    expect(latestTasks(tasks).map((t) => t.task_id)).toEqual([12, 9, 7, 5, 3]);
});

test("the input list isn't reordered", () => {
    const tasks = [task(1, "A"), task(2, "B")];

    latestTasks(tasks);

    expect(tasks.map((t) => t.task_id)).toEqual([1, 2]);
});

test("it is labelled as the latest tasks, not as activity", () => {
    render(<LatestTasks tasks={[task(1, "Buy milk")]} />);

    expect(screen.getByRole("heading", { name: "Latest tasks" })).toBeTruthy();
    expect(screen.queryByText(/activity/i)).toBeNull();
});

test("each task shows whether it is done, overdue or when it is due", () => {
    render(
        <LatestTasks
            tasks={[
                task(3, "Done one", { is_complete: true }),
                task(2, "Late one", { due_date: "2000-01-01" }),
                task(1, "Undated one"),
            ]}
        />
    );

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Done one")).toBeTruthy();
    expect(within(items[0]).getByText("Done")).toBeTruthy();
    expect(within(items[1]).getByText(/Overdue/)).toBeTruthy();
    expect(within(items[2]).getByText("No due date")).toBeTruthy();
});

test("with no tasks it says so", () => {
    render(<LatestTasks tasks={[]} />);

    expect(screen.getByText(/No tasks yet/)).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
});

test("a task due today says so, like the Dashboard's Upcoming list", () => {
    render(<LatestTasks tasks={[task(1, "Today's one", { due_date: toDateKey(new Date()) })]} />);

    expect(screen.getByText("Due today")).toBeTruthy();
});
