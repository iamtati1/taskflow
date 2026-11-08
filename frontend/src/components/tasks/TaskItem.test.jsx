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
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(onDelete).toHaveBeenCalledWith(7);
    expect(onEdit).not.toHaveBeenCalled();
});

// ---------- Deleting asks first ----------

test("Delete asks for confirmation instead of deleting, and focuses the safe choice", () => {
    const { onDelete, onSelect } = renderItem();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    const confirm = screen.getByRole("group", { name: "Delete this task?" });
    expect(confirm.textContent).toContain("Delete this task?");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
});

test("Yes, delete deletes the task once", () => {
    const { onDelete, onSelect } = renderItem();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(7);
    expect(onSelect).not.toHaveBeenCalled();
});

test("Keep cancels and puts focus back on Delete", () => {
    const { onDelete, onSelect } = renderItem();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("group", { name: "Delete this task?" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Delete" }));
});

test("Escape cancels the confirmation", () => {
    const { onDelete } = renderItem();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Keep" }), { key: "Escape" });

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
});

test("Edit and Delete sit in the spaced actions row, not jammed together", () => {
    renderItem();
    const edit = screen.getByRole("button", { name: "Edit" });
    const del = screen.getByRole("button", { name: "Delete" });

    expect(edit.parentElement).toBe(del.parentElement);
    expect(edit.parentElement.className).toMatch(/\bgap-2\b/);
});
