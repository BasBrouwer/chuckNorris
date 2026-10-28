import { createRouter, type RouterHistory } from "@tanstack/react-router";

import { routeTree } from "./route-tree.gen";

/** Builds the app router. Tests pass an in-memory `history` to get an isolated instance. */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    ...(history ? { history } : {}),
  });
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
