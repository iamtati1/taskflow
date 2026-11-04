// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import MobileNav from "./MobileNav";

afterEach(cleanup);

test("the mobile navigation links to every page, including Settings (where Log Out lives)", () => {
    render(
        <MemoryRouter initialEntries={["/tasks"]}>
            <MobileNav />
        </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = within(nav).getAllByRole("link").map((a) => a.getAttribute("href"));

    expect(hrefs).toEqual(["/dashboard", "/tasks", "/analytics", "/settings"]);
});

test("it only shows below the sidebar breakpoint and marks the current page", () => {
    render(
        <MemoryRouter initialEntries={["/tasks"]}>
            <MobileNav />
        </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: "Main" }).className).toMatch(/\blg:hidden\b/);
    expect(screen.getByRole("link", { name: "Tasks" }).getAttribute("aria-current")).toBe("page");
});
