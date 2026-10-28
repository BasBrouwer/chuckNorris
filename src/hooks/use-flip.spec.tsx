import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFlip } from "./use-flip";

type Positions = Record<string, { x: number; y: number }>;

let positions: Positions = {};
const animate = vi.fn();

beforeEach(() => {
  positions = {};
  animate.mockReset();
  // jsdom has no layout and no Web Animations: provide both.
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) {
      return positions[this.dataset["key"] ?? ""]?.x ?? 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetTop", {
    configurable: true,
    get(this: HTMLElement) {
      return positions[this.dataset["key"] ?? ""]?.y ?? 0;
    },
  });
  HTMLElement.prototype.animate = animate as unknown as typeof HTMLElement.prototype.animate;
});

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "offsetLeft");
  Reflect.deleteProperty(HTMLElement.prototype, "offsetTop");
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

function List({ keys }: { keys: readonly string[] }) {
  const flipRef = useFlip(keys);
  return (
    <ul>
      {keys.map((key) => (
        <li key={key} data-key={key} ref={flipRef(key)}>
          {key}
        </li>
      ))}
    </ul>
  );
}

function animatedKeys(): string[] {
  return animate.mock.contexts.map((element) => (element as HTMLElement).dataset["key"] ?? "");
}

describe("useFlip", () => {
  it("does not animate on the first render", () => {
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };

    render(<List keys={["a", "b"]} />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("slides an element that moved from its old position to its new one", () => {
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, c: { x: 0, y: 200 } };
    const { rerender } = render(<List keys={["a", "b"]} />);

    // A new item "c" is inserted first: a and b are pushed one slot further.
    positions = { c: { x: 0, y: 0 }, a: { x: 100, y: 0 }, b: { x: 0, y: 200 } };
    rerender(<List keys={["c", "a", "b"]} />);

    expect(animatedKeys().sort()).toEqual(["a", "b"]);
    const [aKeyframes, aOptions] = animate.mock.calls[animatedKeys().indexOf("a")] as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];
    expect(aKeyframes).toEqual([
      { transform: "translate(-100px, 0px)" },
      { transform: "translate(0, 0)" },
    ]);
    expect(aOptions).toEqual({ duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    const [bKeyframes] = animate.mock.calls[animatedKeys().indexOf("b")] as [Keyframe[]];
    expect(bKeyframes[0]).toEqual({ transform: "translate(100px, -200px)" });
  });

  it("does not animate a new element or one that stayed put", () => {
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
    const { rerender } = render(<List keys={["a", "b"]} />);

    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, c: { x: 0, y: 200 } };
    rerender(<List keys={["a", "b", "c"]} />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("only measures when the keys change, not on every render", () => {
    positions = { a: { x: 0, y: 0 } };
    const { rerender } = render(<List keys={["a"]} />);

    positions = { a: { x: 50, y: 50 } };
    rerender(<List keys={["a"]} />);

    expect(animate).not.toHaveBeenCalled();
  });

  it("skips the animation when the user prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
    const { rerender } = render(<List keys={["a", "b"]} />);

    positions = { b: { x: 0, y: 0 }, a: { x: 100, y: 0 } };
    rerender(<List keys={["b", "a"]} />);

    expect(animate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not animate the shift caused by a window resize on the next change", () => {
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
    const { rerender } = render(<List keys={["a", "b"]} />);

    // The window got narrower: layout moved b without any key change.
    positions = { a: { x: 0, y: 0 }, b: { x: 0, y: 150 } };
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    // Then the order changes; only this change may animate.
    positions = { b: { x: 0, y: 0 }, a: { x: 0, y: 150 } };
    rerender(<List keys={["b", "a"]} />);

    const aIndex = animatedKeys().indexOf("a");
    expect((animate.mock.calls[aIndex] as [Keyframe[]])[0][0]).toEqual({
      transform: "translate(0px, -150px)",
    });
    const bIndex = animatedKeys().indexOf("b");
    expect((animate.mock.calls[bIndex] as [Keyframe[]])[0][0]).toEqual({
      transform: "translate(0px, 150px)",
    });
  });

  it("works where the Web Animations API is missing", () => {
    Reflect.deleteProperty(HTMLElement.prototype, "animate");
    positions = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
    const { rerender } = render(<List keys={["a", "b"]} />);

    positions = { b: { x: 0, y: 0 }, a: { x: 100, y: 0 } };

    expect(() => {
      rerender(<List keys={["b", "a"]} />);
    }).not.toThrow();
  });
});
