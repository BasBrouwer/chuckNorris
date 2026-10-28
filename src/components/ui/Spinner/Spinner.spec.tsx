import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("is decorative and hidden from assistive technology", () => {
    const { container } = render(<Spinner />);

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
