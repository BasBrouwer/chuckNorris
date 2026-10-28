import { createRouter, type RouterHistory } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/** Builds the app router. Tests pass an in-memory `history` to get an isolated instance. */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // Matches Vite's `base`, so routes resolve when the app is served from a sub-path.
    basepath: import.meta.env.BASE_URL,
    ...(history ? { history } : {}),
  });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
