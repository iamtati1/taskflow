// @vitest-environment jsdom
// Each task card is natively draggable (to reorder). A real click often moves
// the pointer a few pixels, which makes the browser start a drag instead of a
// click. Presses that start on a control must not start a drag.
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import TaskList from "./TaskList";

afterEach(cleanup);

const tasks = [
    { task_id: 1, title: "Buy milk", is_complete: false, priority: "medium" },
    { task_id: 2, title: "Old task", is_complete: true, priority: "medium" },
];

const renderList = () => {
    const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onToggle: vi.fn(), onSelect: vi.fn(), reorderTasks: vi.fn() };
    render(<TaskList tasks={tasks} {...handlers} />);
    return handlers;
};

const draggableCardOf = (el) => el.closest("[draggable='true']");
const dragStart = (el) => fireEvent.dragStart(draggableCardOf(el), { dataTransfer: { setData: vi.fn() } });

test("a press on Edit that moves slightly stays a click and opens the editor", () => {
    const { onEdit } = renderList();
    const [edit] = screen.getAllByRole("button", { name: "Edit" });

    // The sequence a browser produces for a click that moved a few pixels
    fireEvent.pointerDown(edit);
    const dragAllowed = dragStart(edit);
    fireEvent.click(edit);

    expect(dragAllowed).toBe(false); // the drag was cancelled
    expect(onEdit).toHaveBeenCalledWith(tasks[0]);
});

test("Edit and Delete are protected the same way, in both the active and completed sections", () => {
    renderList();
    for (const control of [
        ...screen.getAllByRole("button", { name: "Delete" }),
        ...screen.getAllByRole("button", { name: "Edit" }),
    ]) {
        fireEvent.pointerDown(control);
        expect(dragStart(control)).toBe(false);
    }
});

test("dragging a card by its body still starts a reorder drag", () => {
    renderList();
    const title = screen.getByText("Buy milk");

    fireEvent.pointerDown(title);
    expect(dragStart(title)).toBe(true);
});

test("a drag after an earlier click on a control is not blocked", () => {
    renderList();
    const [edit] = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.pointerDown(edit);
    fireEvent.click(edit);

    const title = screen.getByText("Buy milk");
    fireEvent.pointerDown(title);
    expect(dragStart(title)).toBe(true);
});

test("the delete confirmation's buttons can't start a drag either", () => {
    renderList();
    const [del] = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(del);
    for (const name of ["Yes, delete", "Keep"]) {
        const control = screen.getByRole("button", { name });
        fireEvent.pointerDown(control);
        expect(dragStart(control)).toBe(false);
    }
});
