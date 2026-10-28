import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Switch } from "./switch";
import { createSwitchProps } from "./switch.factory";

describe("Switch", () => {
  it("exposes an accessible switch named by its label, with its state", () => {
    render(
      <>
        <label htmlFor="dark-mode">Dark mode</label>
        <Switch {...createSwitchProps({ id: "dark-mode", checked: true })} />
      </>,
    );

    expect(screen.getByRole("switch", { name: "Dark mode" })).toBeChecked();
  });

  it("reports unchecked when checked is false", () => {
    render(<Switch {...createSwitchProps()} />);

    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it.each([
    { checked: false, expected: true },
    { checked: true, expected: false },
  ])("requests $expected when clicked while checked is $checked", async ({ checked, expected }) => {
    const props = createSwitchProps({ checked });
    render(<Switch {...props} />);

    await userEvent.setup().click(screen.getByRole("switch"));

    expect(props.onCheckedChange).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it("can be toggled with the keyboard", async () => {
    const props = createSwitchProps();
    const user = userEvent.setup();
    render(<Switch {...props} />);

    await user.tab();
    await user.keyboard(" ");

    expect(props.onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("stays controlled: the displayed state only changes through props", async () => {
    render(<Switch {...createSwitchProps({ checked: false })} />);

    await userEvent.setup().click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("takes its name from a <label> and toggles when that label is clicked", async () => {
    const props = createSwitchProps({ id: "refresh" });
    render(
      <>
        <label htmlFor="refresh">Auto-refresh</label>
        <Switch {...props} />
      </>,
    );

    await userEvent.setup().click(screen.getByText("Auto-refresh"));

    expect(screen.getByRole("switch", { name: "Auto-refresh" })).toBeVisible();
    expect(props.onCheckedChange).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("is described by the element it points at", () => {
    render(
      <>
        <span id="hint">Every 5 seconds</span>
        <Switch {...createSwitchProps({ describedBy: "hint" })} />
      </>,
    );

    expect(screen.getByRole("switch")).toHaveAccessibleDescription("Every 5 seconds");
  });
});
