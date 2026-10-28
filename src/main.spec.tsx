import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtools: () => null }));

describe("main entry", () => {
  it("mounts the app into #root", async () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.append(root);

    await import("./main");

    expect(await screen.findByRole("heading", { level: 1 })).toBeVisible();
    expect(root).toContainElement(screen.getByRole("banner"));
  });
});
