import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeartIcon } from "./heart-icon";

describe("HeartIcon", () => {
  it("is decorative and hidden from assistive technology", () => {
    const { container } = render(<HeartIcon />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("is an outline by default and solid when filled", () => {
    const outline = render(<HeartIcon />);
    expect(outline.container.querySelector("svg")).toHaveAttribute("fill", "none");
    outline.unmount();

    const solid = render(<HeartIcon filled />);
    expect(solid.container.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });
});
