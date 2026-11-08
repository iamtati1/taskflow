// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";

import { SESSION_ENDED_EVENT } from "./config";
import { taskApi } from "./tasks";

const respond = (status, body) =>
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
    );

afterEach(() => vi.restoreAllMocks());

test("a 401 from the task API announces that the session has ended", async () => {
    const heard = vi.fn();
    window.addEventListener(SESSION_ENDED_EVENT, heard);
    respond(401, { message: "Not authenticated" });

    const res = await taskApi.getTasks();

    window.removeEventListener(SESSION_ENDED_EVENT, heard);
    expect(res).toEqual({ success: false, data: null, error: { message: "Not authenticated" } });
    expect(heard).toHaveBeenCalledTimes(1);
});

test("other failures don't end the session", async () => {
    const heard = vi.fn();
    window.addEventListener(SESSION_ENDED_EVENT, heard);
    for (const status of [400, 403, 404, 500]) {
        respond(status, { error: "nope" });
        await taskApi.updateTask(1, { title: "x" });
    }
    window.removeEventListener(SESSION_ENDED_EVENT, heard);
    expect(heard).not.toHaveBeenCalled();
});
