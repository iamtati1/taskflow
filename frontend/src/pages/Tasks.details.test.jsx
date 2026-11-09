// @vitest-environment jsdom
// Task descriptions, times and the details sheet on the Tasks page, with the
// task API mocked
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() },
}));

import { taskApi } from "../api/tasks";
import { NotificationProvider } from "../context/NotificationContext";
import ToastViewport from "../components/notifications/ToastViewport";
import Tasks from "./Tasks";
import { daysFrom } from "../utils/dates";

const NOTES = "Bring:\n- passport\n- two photos";

const serverTasks = () => [
    { task_id: 2, user_id: 1, title: "Renew passport", is_complete: false, due_date: "2999-03-04", description: NOTES, scheduled_time: "09:30" },
    { task_id: 1, user_id: 1, title: "Buy milk", is_complete: false, due_date: null, description: null, scheduled_time: null },
];

// The server echoes what it saved (blank descriptions become null)
const echo = () => {
    taskApi.updateTask.mockImplementation(async (id, changes) => {
        const saved = { ...serverTasks().find((t) => t.task_id === id), ...changes };
        if (changes.due_date === null) saved.scheduled_time = null;
        return { success: true, data: saved, error: null };
    });
    taskApi.createTask.mockImplementation(async (fields) => ({
        success: true,
        data: { task_id: 9, user_id: 1, is_complete: false, ...fields },
        error: null,
    }));
};

beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    taskApi.getTasks.mockResolvedValue({ success: true, data: serverTasks(), error: null });
    echo();
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const renderTasks = () =>
    render(
        <MemoryRouter>
            <NotificationProvider>
                <Tasks />
                <ToastViewport />
            </NotificationProvider>
        </MemoryRouter>
    );

const cardOf = (title) => screen.getByText(title, { selector: "h3" }).closest("div.group");
const openDetails = async (title) => {
    fireEvent.click(await screen.findByText(title, { selector: "h3" }));
    return screen.findByRole("dialog");
};

// ---------- Cards ----------

test("a card previews its description under the title; a task without one shows nothing extra", async () => {
    renderTasks();
    const card = cardOf(await screen.findByText("Renew passport", { selector: "h3" }) && "Renew passport");

    const preview = within(card).getByText(/Bring:/);
    expect(preview.className).toMatch(/line-clamp-2/);
    expect(within(card).getByText(/9:30/)).toBeTruthy(); // the time is on the due chip

    expect(cardOf("Buy milk").querySelectorAll("p.line-clamp-2")).toHaveLength(0);
});

// ---------- Details ----------

test("details show the full description with its line breaks, and no description section when there is none", async () => {
    renderTasks();
    const dialog = await openDetails("Renew passport");

    expect(within(dialog).getByRole("heading", { level: 3, name: "Description" })).toBeTruthy();
    const full = within(dialog).getByText(/Bring:/);
    expect(full.textContent).toBe(NOTES);
    expect(full.className).toMatch(/whitespace-pre-wrap/);

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    const plain = await openDetails("Buy milk");
    expect(within(plain).queryByRole("heading", { name: "Description" })).toBeNull();
});

test("a task can be moved to tomorrow from its details; the move is saved and confirmed", async () => {
    renderTasks();
    const dialog = await openDetails("Buy milk");

    fireEvent.click(within(dialog).getByRole("button", { name: "Tomorrow" }));

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, { due_date: daysFrom(1) }));
    expect(await within(dialog).findByText("Due tomorrow")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("status", { name: "Notifications" }).textContent).toMatch(/Moved "Buy milk" to/));
});

test("removing the date from details also removes the time", async () => {
    renderTasks();
    const dialog = await openDetails("Renew passport");

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove date" }));

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(2, { due_date: null }));
    expect(await within(dialog).findByText("No due date")).toBeTruthy();
});

test("a task can be completed from its details", async () => {
    renderTasks();
    const dialog = await openDetails("Buy milk");

    fireEvent.click(within(dialog).getByRole("button", { name: "Mark complete" }));

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, { is_complete: true }));
    expect(await within(dialog).findByText("Completed")).toBeTruthy();
});

test("editing from details returns to the details, on Cancel and after saving", async () => {
    renderTasks();
    let dialog = await openDetails("Buy milk");

    fireEvent.click(within(dialog).getByRole("button", { name: "Edit task" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Edit task" })).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "Edit task" }));
    fireEvent.change(await screen.findByLabelText("Description (optional)"), { target: { value: "Oat, not dairy" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, expect.objectContaining({ description: "Oat, not dairy" })));
    dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Oat, not dairy")).toBeTruthy();
});

// ---------- The editor ----------

test("a new task can have a multi-line description and a time, sent exactly as typed", async () => {
    renderTasks();
    fireEvent.click(await screen.findByRole("button", { name: "New Task" }));

    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Dentist" } });
    fireEvent.change(screen.getByLabelText("Description (optional)"), { target: { value: "Ask about\nthe filling" } });

    const time = screen.getByLabelText("Time (optional)");
    expect(time.disabled).toBe(true); // a time needs a date first
    fireEvent.click(screen.getByRole("button", { name: "Tomorrow" }));
    expect(time.disabled).toBe(false);
    fireEvent.change(time, { target: { value: "14:15" } });

    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));

    await waitFor(() =>
        expect(taskApi.createTask).toHaveBeenCalledWith({
            title: "Dentist",
            due_date: daysFrom(1),
            description: "Ask about\nthe filling",
            scheduled_time: "14:15",
        })
    );
});

test("a description is optional, and a blank one is sent as none", async () => {
    renderTasks();
    fireEvent.click(await screen.findByRole("button", { name: "New Task" }));
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Plain task" } });
    fireEvent.change(screen.getByLabelText("Description (optional)"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /Add Task/ }));

    await waitFor(() => expect(taskApi.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Plain task", description: null })));
});

test("editing prefills the description and time; clearing the description sends none and clearing the date drops the time", async () => {
    renderTasks();
    fireEvent.click(within(cardOf(await screen.findByText("Renew passport", { selector: "h3" }) && "Renew passport")).getByRole("button", { name: "Edit" }));

    const description = await screen.findByLabelText("Description (optional)");
    expect(description.value).toBe(NOTES);
    expect(screen.getByLabelText("Time (optional)").value).toBe("09:30");

    fireEvent.change(description, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(screen.getByLabelText("Time (optional)").value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    await waitFor(() =>
        expect(taskApi.updateTask).toHaveBeenCalledWith(2, {
            title: "Renew passport",
            due_date: null,
            description: null,
            scheduled_time: null,
        })
    );
});

test("a server refusal (e.g. a database not yet updated) keeps the editor open with the message", async () => {
    taskApi.updateTask.mockResolvedValue({
        success: false,
        data: null,
        error: { message: "Descriptions can't be saved yet: this database hasn't been updated for them." },
    });
    renderTasks();
    fireEvent.click(within(cardOf(await screen.findByText("Buy milk", { selector: "h3" }) && "Buy milk")).getByRole("button", { name: "Edit" }));
    fireEvent.change(await screen.findByLabelText("Description (optional)"), { target: { value: "notes" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Task/ }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/can't be saved yet/);
    expect(screen.getByLabelText("Description (optional)").value).toBe("notes");
});
