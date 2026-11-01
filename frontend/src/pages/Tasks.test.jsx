// @vitest-environment jsdom
// The whole edit flow on the Tasks page, with the task API mocked:
// click Edit -> form opens in view, prefilled -> change title -> save -> list updates.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../api/tasks", () => ({
    taskApi: {
        getTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
    },
}));

import { taskApi } from "../api/tasks";
import Tasks from "./Tasks";

const serverTasks = () => [
    { task_id: 2, user_id: 1, title: "Write report", is_complete: false, due_date: null },
    { task_id: 1, user_id: 1, title: "Buy milk", is_complete: false, due_date: null },
];

beforeEach(() => {
    // jsdom has no layout, so scrolling is recorded rather than performed
    Element.prototype.scrollIntoView = vi.fn();
    taskApi.getTasks.mockResolvedValue({ success: true, data: serverTasks(), error: null });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const openEditFor = async (title) => {
    render(<Tasks />);
    const card = (await screen.findByText(title)).closest("div.group");
    fireEvent.click(within(card).getByRole("button", { name: "Edit" }));
    return screen.findByRole("heading", { name: "Edit Task" });
};

test("clicking Edit opens the form in view with the task's title, focused", async () => {
    await openEditFor("Write report");

    const input = screen.getByPlaceholderText("Task title...");
    expect(input.value).toBe("Write report");
    expect(document.activeElement).toBe(input);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
});

test("saving an edit sends the right task id and shows the saved title", async () => {
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...serverTasks().find((t) => t.task_id === id), ...changes },
        error: null,
    }));

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Write final report" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Edit Task" })).toBeNull());
    expect(taskApi.updateTask).toHaveBeenCalledWith(2, { title: "Write final report" });
    expect(screen.getByText("Write final report")).toBeTruthy();
    expect(screen.queryByText("Write report")).toBeNull();
    expect(screen.getByText("Buy milk")).toBeTruthy();
});

test("a failed save keeps the form open with the error and restores the list", async () => {
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Not authenticated" } });

    await openEditFor("Write report");
    fireEvent.change(screen.getByPlaceholderText("Task title..."), { target: { value: "Will fail" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    expect((await screen.findByRole("alert")).textContent).toBe("Not authenticated");
    expect(screen.getByPlaceholderText("Task title...").value).toBe("Will fail");
    expect(screen.getByText("Write report")).toBeTruthy();
    expect(screen.getByText("Buy milk")).toBeTruthy();
});
