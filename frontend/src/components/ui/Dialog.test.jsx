// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import Dialog from "./Dialog";

afterEach(cleanup);

function Harness() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button type="button" onClick={() => setOpen(true)}>Open</button>
            <Dialog open={open} onClose={() => setOpen(false)} labelledBy="dialog-title">
                <h2 id="dialog-title">Example</h2>
                <input aria-label="First field" autoFocus />
                <button type="button">Middle</button>
                <button type="button" onClick={() => setOpen(false)}>Done</button>
            </Dialog>
        </>
    );
}

const openDialog = () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open" });
    opener.focus();
    fireEvent.click(opener);
    return opener;
};

test("it's a labelled modal dialog and locks page scrolling while open", async () => {
    openDialog();
    const dialog = screen.getByRole("dialog", { name: "Example" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.body.style.overflow).toBe("");
});

test("Escape closes it and focus returns to the button that opened it", async () => {
    const opener = openDialog();
    fireEvent.keyDown(screen.getByRole("button", { name: "Middle" }), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(opener);
});

test("Tab and Shift+Tab stay inside the dialog", () => {
    openDialog();
    const first = screen.getByRole("textbox", { name: "First field" });
    const last = screen.getByRole("button", { name: "Done" });

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
});
