// @vitest-environment jsdom
// The Calendar page, with the task API mocked. Days are relative to today,
// so the tests hold whenever they run.
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../api/tasks", () => ({
    taskApi: { getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn() },
}));

import { taskApi } from "../api/tasks";
import { NotificationProvider } from "../context/NotificationContext";
import ToastViewport from "../components/notifications/ToastViewport";
import CalendarWidget from "../components/calendar/CalendarWidget";
import Calendar from "./Calendar";
import { TASK_DRAG_TYPE } from "../components/calendar/useCalendarDrag";
import { addDays, dayLabel, viewHeading } from "../utils/calendar";
import { daysFrom } from "../utils/dates";

const TODAY = daysFrom(0);
const TOMORROW = daysFrom(1);

const serverTasks = () => [
    { task_id: 1, user_id: 1, title: "Dentist", is_complete: false, due_date: TODAY, scheduled_time: "14:15", description: null },
    { task_id: 2, user_id: 1, title: "Pay rent", is_complete: false, due_date: TODAY, scheduled_time: null, description: "Online" },
    { task_id: 3, user_id: 1, title: "Water plants", is_complete: true, due_date: TODAY, scheduled_time: "08:00", description: null },
    { task_id: 4, user_id: 1, title: "Call mum", is_complete: false, due_date: TOMORROW, scheduled_time: null, description: null },
    { task_id: 5, user_id: 1, title: "Someday idea", is_complete: false, due_date: null, scheduled_time: null, description: null },
];

beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    taskApi.getTasks.mockResolvedValue({ success: true, data: serverTasks(), error: null });
    taskApi.updateTask.mockImplementation(async (id, changes) => ({
        success: true,
        data: { ...serverTasks().find((t) => t.task_id === id), ...changes },
        error: null,
    }));
    taskApi.createTask.mockImplementation(async (fields) => ({
        success: true,
        data: { task_id: 9, user_id: 1, is_complete: false, ...fields },
        error: null,
    }));
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Shows the address, to check what the page keeps in it
function Address() {
    const { search } = useLocation();
    return <output data-testid="search">{search}</output>;
}

const renderCalendar = (search = "?view=month") =>
    render(
        <MemoryRouter initialEntries={[`/calendar${search}`]}>
            <NotificationProvider>
                <Routes>
                    <Route path="/calendar" element={<><Calendar /><Address /></>} />
                </Routes>
                <ToastViewport />
            </NotificationProvider>
        </MemoryRouter>
    );

const params = () => new URLSearchParams(screen.getByTestId("search").textContent);
const period = () => screen.getByRole("heading", { level: 2 }).textContent;
const dayButton = (key) => screen.getByRole("grid").querySelector(`[data-day="${key}"]`);
const agenda = (key) => screen.getByRole("region", { name: dayLabel(key) });

const dragData = () => {
    const data = {};
    return {
        types: [],
        setData(type, value) { data[type] = value; this.types.push(type); },
        getData: (type) => data[type] ?? "",
        effectAllowed: "", dropEffect: "",
    };
};

// ---------- Views and navigation ----------

test("the month view marks today, lists the selected day's tasks in time order, and counts undated tasks", async () => {
    renderCalendar();
    await screen.findByRole("grid");

    expect(period()).toBe(viewHeading("month", TODAY));
    const today = dayButton(TODAY);
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(today.getAttribute("aria-label")).toMatch(/today, 3 tasks, 1 done/);
    expect(today.tabIndex).toBe(0); // the one day in the tab order

    // Untimed first ("Any time"), then by time; done last
    const rows = within(agenda(TODAY)).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
        expect.stringMatching(/Any time.*Pay rent.*Online/),
        expect.stringMatching(/2:15.*Dentist/),
        expect.stringMatching(/8:00.*Water plants/),
    ]);

    expect(screen.getByText(/1 open task has no due date/)).toBeTruthy();
});

test("Previous, Next and Today move by the view's length; switching views keeps the day", async () => {
    renderCalendar(`?view=month&date=${TODAY}`);
    await screen.findByRole("grid");

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    const nextMonth = params().get("date");
    expect(period()).toBe(viewHeading("month", nextMonth));
    expect(screen.getByRole("button", { name: "Today" }).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(params().get("view")).toBe("week");
    expect(params().get("date")).toBe(nextMonth);
    expect(period()).toBe(viewHeading("week", nextMonth));

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(params().get("date")).toBe(addDays(nextMonth, -7));

    fireEvent.click(screen.getByRole("button", { name: "Day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    expect(params().get("date")).toBe(addDays(nextMonth, -6));

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(params().get("date")).toBe(TODAY);
    expect(period()).toBe(viewHeading("day", TODAY));
});

test("a bad address falls back to today", async () => {
    renderCalendar("?view=year&date=2026-02-30");
    await screen.findByRole("grid"); // jsdom is wide: the month
    expect(period()).toBe(viewHeading("month", TODAY));
});

test("arrow keys move the selected day, and focus follows", async () => {
    renderCalendar(`?view=month&date=${TODAY}`);
    await screen.findByRole("grid");

    dayButton(TODAY).focus();
    fireEvent.keyDown(dayButton(TODAY), { key: "ArrowRight" });
    expect(params().get("date")).toBe(TOMORROW);
    await waitFor(() => expect(document.activeElement).toBe(dayButton(TOMORROW)));

    fireEvent.keyDown(dayButton(TOMORROW), { key: "ArrowDown" });
    expect(params().get("date")).toBe(addDays(TOMORROW, 7));
    expect(within(agenda(addDays(TOMORROW, 7))).getByText(/Nothing due/)).toBeTruthy();
});

test("the week view lists each day's tasks", async () => {
    renderCalendar(`?view=week&date=${TODAY}`);
    const week = await screen.findByRole("list", { name: "Week" });
    expect(within(week).getAllByRole("button", { name: /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), / })).toHaveLength(7);
    expect(within(week).getByRole("button", { name: /Dentist/ })).toBeTruthy();
});

// ---------- Tasks from the calendar ----------

test("a task opens its details, and can be completed from the day's list", async () => {
    renderCalendar(`?view=day&date=${TODAY}`);
    fireEvent.click(await screen.findByRole("button", { name: /^Pay rent/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Pay rent" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Mark complete: Dentist" }));
    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, { is_complete: true }));
});

test("a task added from a day starts on that day", async () => {
    renderCalendar(`?view=day&date=${TOMORROW}`);
    fireEvent.click(await screen.findByRole("button", { name: "Add task" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Pick up parcel" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /Add Task/ }));

    await waitFor(() =>
        expect(taskApi.createTask).toHaveBeenCalledWith(expect.objectContaining({ title: "Pick up parcel", due_date: TOMORROW }))
    );
    expect(await within(agenda(TOMORROW)).findByText("Pick up parcel")).toBeTruthy();
});

// ---------- Drag to reschedule ----------

test("dragging a task onto another day moves it there and saves the move", async () => {
    renderCalendar(`?view=month&date=${TODAY}`);
    await screen.findByRole("grid");
    const target = addDays(TODAY, 2);

    const chip = within(dayButton(TODAY).closest("td")).getByRole("button", { name: /Dentist/ });
    const cell = dayButton(target).closest("td");
    const dataTransfer = dragData();
    fireEvent.dragStart(chip, { dataTransfer });
    fireEvent.dragOver(cell, { dataTransfer });
    expect(cell.className).toMatch(/border-cyan-300/); // the day lights up
    fireEvent.drop(cell, { dataTransfer });

    await waitFor(() => expect(taskApi.updateTask).toHaveBeenCalledWith(1, { due_date: target }));
    expect(within(cell).getByRole("button", { name: /Dentist/ })).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("status", { name: "Notifications" }).textContent).toMatch(/Moved "Dentist" to/));
});

test("a move the server refuses is put back, and says so", async () => {
    taskApi.updateTask.mockResolvedValue({ success: false, data: null, error: { message: "Server unavailable" } });
    renderCalendar(`?view=month&date=${TODAY}`);
    await screen.findByRole("grid");
    const target = addDays(TODAY, 2);

    const chip = within(dayButton(TODAY).closest("td")).getByRole("button", { name: /Dentist/ });
    const dataTransfer = dragData();
    fireEvent.dragStart(chip, { dataTransfer });
    fireEvent.drop(dayButton(target).closest("td"), { dataTransfer });

    await waitFor(() => expect(screen.getByRole("status", { name: "Notifications" }).textContent).toMatch(/Couldn't move "Dentist": Server unavailable/));
    expect(within(dayButton(TODAY).closest("td")).getByRole("button", { name: /Dentist/ })).toBeTruthy();
    expect(within(dayButton(target).closest("td")).queryByRole("button", { name: /Dentist/ })).toBeNull();
});

test("text dragged in from elsewhere, or a drop on the same day, changes nothing", async () => {
    renderCalendar(`?view=month&date=${TODAY}`);
    await screen.findByRole("grid");

    const outside = dragData();
    outside.setData("text/plain", "1");
    fireEvent.drop(dayButton(TOMORROW).closest("td"), { dataTransfer: outside });

    const chip = within(dayButton(TODAY).closest("td")).getByRole("button", { name: /Dentist/ });
    const same = dragData();
    fireEvent.dragStart(chip, { dataTransfer: same });
    expect(same.getData(TASK_DRAG_TYPE)).toBe("1");
    fireEvent.drop(dayButton(TODAY).closest("td"), { dataTransfer: same });

    expect(taskApi.updateTask).not.toHaveBeenCalled();
});

// ---------- The compact calendar ----------

test("the compact calendar links each day to that day on the Calendar page", () => {
    render(
        <MemoryRouter>
            <CalendarWidget tasks={serverTasks()} />
        </MemoryRouter>
    );
    const today = screen.getByRole("link", { name: new RegExp(`^${dayLabel(TODAY)}, today, 3 tasks, 1 done$`) });
    expect(today.getAttribute("href")).toBe(`/calendar?view=day&date=${TODAY}`);
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(screen.getByText(/due in the next 7 days/).textContent).toMatch(/^3 tasks/);
});
