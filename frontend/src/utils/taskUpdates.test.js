import { test } from "node:test";
import assert from "node:assert";

import { storedFields, replaceTask } from "./taskUpdates.js";

const tasks = [
    { task_id: 1, title: "Buy milk", is_complete: false, priority: "medium" },
    { task_id: 2, title: "Write report", is_complete: false, priority: "medium" },
];

test("storedFields keeps only what the server saves", () => {
    assert.deepStrictEqual(
        storedFields({ title: "New", description: "notes", priority: "high", is_complete: undefined }),
        { title: "New" }
    );
    assert.deepStrictEqual(storedFields(), {});
});

test("replaceTask updates only the task with that id, without mutating the list", () => {
    const next = replaceTask(tasks, 2, { title: "Write final report" });
    assert.strictEqual(next[1].title, "Write final report");
    assert.strictEqual(next[1].priority, "medium", "untouched fields are kept");
    assert.strictEqual(next[0], tasks[0]);
    assert.strictEqual(tasks[1].title, "Write report");
});

test("an edit shows the new title immediately, then the server's saved task", () => {
    // What editTask does: optimistic stored fields, then the server response
    const optimistic = replaceTask(tasks, 2, storedFields({ title: "Write final report", priority: "high" }));
    assert.strictEqual(optimistic[1].title, "Write final report");
    assert.strictEqual(optimistic[1].priority, "medium", "unsaved priority is not shown as changed");

    const server = { task_id: 2, user_id: 7, title: "Write final report", is_complete: false, due_date: null };
    const saved = replaceTask(optimistic, 2, server);
    assert.strictEqual(saved[1].title, "Write final report");
    assert.strictEqual(saved[1].user_id, 7);
});

test("a failed edit restores the previous task", () => {
    const previous = tasks[1];
    const optimistic = replaceTask(tasks, 2, { title: "Oops" });
    const rolledBack = replaceTask(optimistic, 2, previous);
    assert.deepStrictEqual(rolledBack, tasks);
});

test("a task id that isn't in the list changes nothing", () => {
    assert.deepStrictEqual(replaceTask(tasks, 99, { title: "x" }), tasks);
});
