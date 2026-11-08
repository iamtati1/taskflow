// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { NotificationProvider, useNotifications } from "../../context/NotificationContext";
import ToastViewport from "./ToastViewport";

function Trigger({ message = "Completed \"Buy milk\"", type = "success" }) {
    const { addNotification } = useNotifications();
    return (
        <button type="button" onClick={() => addNotification(message, type)}>
            Notify
        </button>
    );
}

const renderViewport = (props) =>
    render(
        <NotificationProvider>
            <Trigger {...props} />
            <ToastViewport />
        </NotificationProvider>
    );

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

test("the live region exists before any toast, so the first one is announced", () => {
    renderViewport();

    const region = screen.getByRole("status", { name: "Notifications" });
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("");
});

test("a toast appears inside the live region", () => {
    renderViewport();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    const region = screen.getByRole("status", { name: "Notifications" });
    expect(region.textContent).toContain("Completed \"Buy milk\"");
});

test("a toast can be dismissed", async () => {
    renderViewport();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    await waitFor(() => expect(screen.queryByText("Completed \"Buy milk\"")).toBeNull());
});

test("a toast hides itself after 4 seconds", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    renderViewport();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    act(() => vi.advanceTimersByTime(3900));
    expect(screen.getByText("Completed \"Buy milk\"")).toBeTruthy();

    act(() => vi.advanceTimersByTime(200));
    vi.useRealTimers();
    await waitFor(() => expect(screen.queryByText("Completed \"Buy milk\"")).toBeNull());
});

test("several toasts stack, each with its own dismiss button", () => {
    renderViewport();

    fireEvent.click(screen.getByRole("button", { name: "Notify" }));
    fireEvent.click(screen.getByRole("button", { name: "Notify" }));

    expect(screen.getAllByRole("button", { name: "Dismiss notification" })).toHaveLength(2);
});
