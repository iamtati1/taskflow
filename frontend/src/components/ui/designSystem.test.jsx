// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, renderHook, act, screen } from "@testing-library/react";
import { useState } from "react";
import { ListChecks } from "lucide-react";

import Button from "./Button";
import PillGroup from "./PillGroup";
import StatCard from "./StatCard";
import SectionHeader from "./SectionHeader";
import Field from "./Field";
import useUISettings from "../../hooks/useUISettings";

afterEach(() => {
    cleanup();
    delete document.startViewTransition;
});

test("a loading Button is busy, can't be clicked, and keeps its label", () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Saving...</Button>);
    const button = screen.getByRole("button", { name: "Saving..." });

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
});

test("PillGroup marks one pill pressed and reports choices", () => {
    function Harness() {
        const [value, setValue] = useState("b");
        return (
            <PillGroup
                label="Pick one"
                value={value}
                onChange={setValue}
                options={[{ label: "A", value: "a" }, { label: "B", value: "b" }]}
            />
        );
    }
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Pick one" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "B" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(screen.getByRole("button", { name: "A" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "B" }).getAttribute("aria-pressed")).toBe("false");
});

test("StatCard shows the value as a heading with its label", () => {
    render(<StatCard icon={ListChecks} value={7} label="Active" tone="accent" />);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("7");
    expect(screen.getByText("Active")).toBeTruthy();
});

test("SectionHeader is a heading, with an optional count", () => {
    render(<SectionHeader icon={ListChecks} count={3}>Upcoming</SectionHeader>);
    expect(screen.getByRole("heading", { level: 2, name: "Upcoming" })).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
});

test("Field labels its control and announces an error", () => {
    render(
        <Field id="f" label="Title" error="Required">
            <input id="f" />
        </Field>
    );
    expect(screen.getByLabelText("Title")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Required");
});

test("changing theme crossfades when the browser supports view transitions", () => {
    const startViewTransition = vi.fn((update) => update());
    document.startViewTransition = startViewTransition;
    const { result } = renderHook(() => useUISettings());

    act(() => result.current.setTheme("emerald"));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement.getAttribute("data-theme")).toBe("emerald");

    act(() => result.current.setTheme("emerald")); // same theme: nothing to fade
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    act(() => result.current.setTheme("midnight"));
});

test("without view transitions the theme still changes, instantly", () => {
    const { result } = renderHook(() => useUISettings());
    act(() => result.current.setTheme("sunset"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("sunset");
    act(() => result.current.setTheme("midnight"));
});
