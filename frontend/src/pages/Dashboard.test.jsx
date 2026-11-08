// @vitest-environment jsdom
// The Dashboard page shows loading and failures as such, never as an empty workspace
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() },
}));

import { taskApi } from "../api/tasks";
import { NotificationProvider } from "../context/NotificationContext";
import Dashboard from "./Dashboard";

const renderPage = () =>
    render(
        <MemoryRouter>
            <NotificationProvider>
                <Dashboard />
            </NotificationProvider>
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

// ---------- What the numbers and lists say ----------

import { within } from "@testing-library/react";
import { toDateKey } from "../utils/dates";

const loaded = (tasks) => taskApi.getTasks.mockResolvedValue({ success: true, data: tasks, error: null });
const task = (task_id, title, due_date, is_complete = false) => ({ task_id, user_id: 1, title, is_complete, due_date });
// The card (rounded-2xl) that a heading or label belongs to
const cardOf = (el) => el.closest("div.rounded-2xl");

test("an overdue task is marked overdue in Today's Focus and Upcoming, not shown as upcoming", async () => {
    loaded([task(1, "Renew passport", "2000-01-01"), task(2, "Plan trip", "2999-03-04")]);
    renderPage();

    const focus = cardOf(await screen.findByText("Today's Focus"));
    expect(within(focus).getByText("Renew passport")).toBeTruthy();
    expect(within(focus).getByText("Overdue · was due Jan 1")).toBeTruthy();

    const upcoming = cardOf(screen.getByText("Upcoming Tasks"));
    expect(within(upcoming).getByText("Overdue · was due Jan 1")).toBeTruthy();
    expect(within(upcoming).getByText("Due Mar 4")).toBeTruthy();
});

test("the fourth tile counts tasks due today instead of repeating the completed count", async () => {
    const today = toDateKey(new Date());
    loaded([task(1, "Today A", today), task(2, "Today B", today), task(3, "Done today", today, true), task(4, "Later", "2999-01-01"), task(5, "Finished", null, true)]);
    renderPage();

    await screen.findAllByText("Due today");
    expect(screen.queryByText("Momentum")).toBeNull();
    // The stat tile is the "Due today" card whose big number is an h3
    const tile = screen.getAllByText("Due today").map(cardOf).find((card) => /^\d+$/.test(card?.querySelector("h3")?.textContent ?? ""));
    expect(tile.querySelector("h3").textContent).toBe("2");
});

test("counts read naturally in the singular", async () => {
    loaded([task(1, "Only one", null), task(2, "Done", null, true)]);
    renderPage();

    expect(await screen.findByText("1 active task • 1 completed")).toBeTruthy();
});

test("the most urgent task can be completed from Today's Focus, and the next one takes its place", async () => {
    loaded([task(1, "Renew passport", "2000-01-01"), task(2, "Plan trip", "2999-03-04")]);
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...task(id, id === 1 ? "Renew passport" : "Plan trip", id === 1 ? "2000-01-01" : "2999-03-04"), ...changes },
        error: null,
    }));
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: 'Complete "Renew passport"' }));

    expect(taskApi.updateTask).toHaveBeenCalledWith(1, { is_complete: true });
    const focus = cardOf(screen.getByText("Today's Focus"));
    // It stays a moment, ticked, so the completion is seen...
    expect(await within(focus).findByText("Done. Nice work.")).toBeTruthy();
    // ...then the next most urgent task takes its place
    expect(await within(focus).findByText("Plan trip", {}, { timeout: 2000 })).toBeTruthy();
    expect(within(focus).queryByText("Renew passport")).toBeNull();
});

test("if completing the focus task fails, it stays as the focus, still open", async () => {
    loaded([task(1, "Renew passport", "2000-01-01"), task(2, "Plan trip", "2999-03-04")]);
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Network error" } });
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: 'Complete "Renew passport"' }));

    const focus = cardOf(screen.getByText("Today's Focus"));
    await waitFor(() => expect(within(focus).queryByText("Done. Nice work.")).toBeNull());
    expect(within(focus).getByText("Renew passport")).toBeTruthy();
    expect(within(focus).getByText("Overdue · was due Jan 1")).toBeTruthy();
});

test("Today's Focus has an honest empty state, with nothing planned or everything done", async () => {
    loaded([]);
    renderPage();
    const empty = cardOf(await screen.findByText("Today's Focus"));
    expect(within(empty).getByText("Nothing planned yet")).toBeTruthy();
    expect(within(empty).getByRole("button", { name: "New task" })).toBeTruthy();

    cleanup();
    loaded([task(1, "Finished", null, true)]);
    renderPage();
    const clear = cardOf(await screen.findByText("Today's Focus"));
    expect(within(clear).getByText("All clear")).toBeTruthy();
});

test("Upcoming lists the five most urgent dated tasks and links to the rest", async () => {
    loaded([1, 2, 3, 4, 5, 6, 7].map((id) => task(id, `Task ${id}`, `2999-01-0${id}`)));
    renderPage();

    const upcoming = cardOf(await screen.findByText("Upcoming Tasks"));
    expect(within(upcoming).getAllByRole("listitem")).toHaveLength(5);
    expect(within(upcoming).getByText("Task 1")).toBeTruthy();
    expect(within(upcoming).queryByText("Task 6")).toBeNull();
    expect(within(upcoming).getByRole("link", { name: "2 more in Tasks" }).getAttribute("href")).toBe("/tasks");
});

test("the hero says how many tasks need attention today, or that nothing does", async () => {
    const today = toDateKey(new Date());
    loaded([task(1, "Late", "2000-01-01"), task(2, "Today", today)]);
    renderPage();
    expect(await screen.findByText("2 tasks need your attention today")).toBeTruthy();

    cleanup();
    loaded([task(3, "Later", "2999-01-01")]);
    renderPage();
    expect(await screen.findByText("Nothing overdue or due today")).toBeTruthy();
});
