import { describe, expect, it, vi } from "vitest";

import { captureInterval } from "./captureInterval";

describe("captureInterval", () => {
  it("runs the captured callback on demand instead of waiting in real time", () => {
    const interval = captureInterval(5000);
    const callback = vi.fn();

    setInterval(callback, 5000);
    expect(callback).not.toHaveBeenCalled();
    interval.fire();
    interval.fire();

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("reports whether the interval is running and stops after clearInterval", () => {
    const interval = captureInterval(5000);
    expect(interval.isRunning()).toBe(false);

    const handle = setInterval(vi.fn(), 5000);
    expect(interval.isRunning()).toBe(true);
    clearInterval(handle);

    expect(interval.isRunning()).toBe(false);
  });

  it("lets intervals with other delays run for real", async () => {
    captureInterval(5000);
    const callback = vi.fn();

    const handle = setInterval(callback, 5);
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });
    clearInterval(handle);
  });

  it("throws if a second interval with the same delay is registered, which would hide a doubled timer", () => {
    captureInterval(5000);
    setInterval(vi.fn(), 5000);

    expect(() => setInterval(vi.fn(), 5000)).toThrow("already registered");
  });

  it("throws when asked to fire before anything registered", () => {
    expect(() => {
      captureInterval(5000).fire();
    }).toThrow("No 5000ms interval is registered");
  });
});
