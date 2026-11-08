// @vitest-environment jsdom
// The Analytics page shows loading and failures as such, never as an empty workspace
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() },
}));

import { taskApi } from "../api/tasks";
import Analytics from "./Analytics";

const renderPage = () =>
    render(
        <MemoryRouter>
            <Analytics />
        </MemoryRouter>
    );

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

test("while tasks load it says so, without showing zeros as if they were real", () => {
    taskApi.getTasks.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText("Loading tasks...")).toBeTruthy();
    expect(screen.queryByText("0%")).toBeNull();
});

test("a failed load explains the problem and can be retried", async () => {
    taskApi.getTasks
        .mockResolvedValueOnce({ success: false, data: null, error: { message: "Network error" } })
        .mockResolvedValueOnce({
            success: true,
            data: [
                { task_id: 2, user_id: 1, title: "Done thing", is_complete: true, due_date: null },
                { task_id: 1, user_id: 1, title: "Open thing", is_complete: false, due_date: null },
            ],
            error: null,
        });
    renderPage();

    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't load your tasks: Network error/);
    expect(screen.queryByText("0%")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect((await screen.findAllByText("50%")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
});

// ---------- What the charts show ----------

import { within } from "@testing-library/react";
import { toDateKey } from "../utils/dates";

const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toDateKey(d);
};
const task = (task_id, due_date, is_complete = false) => ({ task_id, user_id: 1, title: `Task ${task_id}`, is_complete, due_date });

test("open tasks are grouped by due date; completed ones aren't counted there", async () => {
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [task(1, inDays(-2)), task(2, inDays(0)), task(3, inDays(3)), task(4, inDays(20)), task(5, null), task(6, inDays(-5), true)],
        error: null,
    });
    renderPage();

    const chart = (await screen.findByText("Open tasks by due date")).closest("div.rounded-2xl");
    const countFor = (label) => within(chart).getByText(label).parentElement.lastElementChild.textContent;
    expect(["Overdue", "Due today", "This week", "Later", "No due date"].map(countFor)).toEqual(["1", "1", "1", "1", "1"]);
});

test("the next 7 days chart says how many tasks are due each day, for screen readers too", async () => {
    taskApi.getTasks.mockResolvedValue({
        success: true,
        data: [task(1, inDays(0)), task(2, inDays(0)), task(3, inDays(2)), task(4, inDays(9))],
        error: null,
    });
    renderPage();

    const chart = (await screen.findByText("The next 7 days")).closest("div.rounded-2xl");
    const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    expect(within(chart).getByText(`${today}: 2 tasks due`)).toBeTruthy();
    expect(within(chart).getAllByText(/: 0 tasks due$/)).toHaveLength(5);
});

test("with no tasks it explains where the charts will come from", async () => {
    taskApi.getTasks.mockResolvedValue({ success: true, data: [], error: null });
    renderPage();

    expect(await screen.findByText("No data yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a task" })).toBeTruthy();
});
