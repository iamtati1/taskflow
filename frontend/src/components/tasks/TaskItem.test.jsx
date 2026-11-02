// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import TaskItem from "./TaskItem";

afterEach(cleanup);

const task = { task_id: 7, title: "Write report", is_complete: false, priority: "medium" };

const renderItem = () => {
    const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onSelect: vi.fn(), onToggle: vi.fn() };
    render(<TaskItem task={task} {...handlers} />);
    return handlers;
};

test("Edit is an enabled, clickable button that passes the task to onEdit", () => {
    const { onEdit, onDelete, onSelect } = renderItem();
    const edit = screen.getByRole("button", { name: "Edit" });

    expect(edit.disabled).toBe(false);
    expect(edit.getAttribute("type")).toBe("button");

    fireEvent.click(edit);

    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
});

test("Delete is a separate button and never triggers Edit", () => {
    const { onEdit, onDelete } = renderItem();
    const del = screen.getByRole("button", { name: "Delete" });

    expect(del.getAttribute("type")).toBe("button");
    fireEvent.click(del);

    expect(onDelete).toHaveBeenCalledWith(7);
    expect(onEdit).not.toHaveBeenCalled();
});

test("Edit and Delete sit in the spaced actions row, not jammed together", () => {
    renderItem();
    const edit = screen.getByRole("button", { name: "Edit" });
    const del = screen.getByRole("button", { name: "Delete" });

    expect(edit.parentElement).toBe(del.parentElement);
    expect(edit.parentElement.className).toMatch(/\bgap-2\b/);
});
