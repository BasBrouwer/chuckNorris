import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./Hero";
import { createHeroProps } from "./Hero.factory";

describe("Hero", () => {
  it("uses the title as the page's level-1 heading", () => {
    render(<Hero {...createHeroProps({ title: "The keepers." })} />);

    expect(screen.getByRole("heading", { level: 1, name: "The keepers." })).toBeVisible();
  });

  it("renders the eyebrow and description", () => {
    render(
      <Hero
        {...createHeroProps({ eyebrow: "Your collection", description: "Saved for later." })}
      />,
    );

    expect(screen.getByText("Your collection")).toBeVisible();
    expect(screen.getByText("Saved for later.")).toBeVisible();
  });
});
