import { useEffect, useLayoutEffect, useRef } from "react";

const DURATION_MS = 400;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

interface Position {
  x: number;
  y: number;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/**
 * FLIP list animation: when `keys` change (items added, removed or reordered),
 * every element that stayed in the list slides from where it was to where it is now.
 * New elements are not animated here; give them their own entrance.
 *
 * Attach it with `ref={flipRef(key)}` on each item's root element. Positions are read
 * from `offsetLeft/offsetTop`, so transforms (hover lifts, running animations) and page
 * scroll never register as movement.
 */
export function useFlip(keys: readonly string[]) {
  const elements = useRef(new Map<string, HTMLElement>());
  const previous = useRef(new Map<string, Position>());
  const signature = keys.join("\u0000");

  function flipRef(key: string) {
    return (element: HTMLElement | null) => {
      if (element === null) {
        elements.current.delete(key);
      } else {
        elements.current.set(key, element);
      }
    };
  }

  // Runs after React updated the DOM and before the browser paints, so the old
  // position is applied as a transform before anything is shown at the new one.
  useLayoutEffect(() => {
    const next = measure(elements.current);
    const canAnimate = !prefersReducedMotion();

    for (const [key, position] of next) {
      const element = elements.current.get(key);
      const before = previous.current.get(key);
      if (!canAnimate || element === undefined || before === undefined) {
        continue;
      }
      const dx = before.x - position.x;
      const dy = before.y - position.y;
      if ((dx !== 0 || dy !== 0) && typeof element.animate === "function") {
        element.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
          { duration: DURATION_MS, easing: EASING },
        );
      }
    }
    previous.current = next;
  }, [signature]);

  // Window resizes move items without changing keys; keep the baseline current so
  // the next change does not animate the resize.
  useEffect(() => {
    function remeasure() {
      previous.current = measure(elements.current);
    }
    window.addEventListener("resize", remeasure);
    return () => {
      window.removeEventListener("resize", remeasure);
    };
  }, []);

  return flipRef;
}

function measure(elements: ReadonlyMap<string, HTMLElement>): Map<string, Position> {
  const positions = new Map<string, Position>();
  for (const [key, element] of elements) {
    positions.set(key, { x: element.offsetLeft, y: element.offsetTop });
  }
  return positions;
}
