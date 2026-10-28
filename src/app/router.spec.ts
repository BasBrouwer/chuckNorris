import { describe, expect, it } from "vitest";

import { router } from "./router";

describe("router", () => {
  it("exposes exactly the app's pages, so a missing route file fails loudly", () => {
    expect(Object.keys(router.routesByPath).toSorted()).toEqual(["/", "/favorites"]);
  });
});
