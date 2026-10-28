import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

interface RenderWithRouterOptions {
  /** Initial location. Defaults to "/". */
  path?: "/" | "/favorites";
}

/**
 * Renders `ui` inside a throwaway in-memory router that knows the app's paths,
 * for components that use `<Link>`. Resolves once the router has loaded.
 */
export async function renderWithRouter(
  ui: ReactNode,
  { path = "/" }: RenderWithRouterOptions = {},
) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  });
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: "/" }),
    createRoute({ getParentRoute: () => rootRoute, path: "/favorites" }),
  ]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();
  const result = render(<RouterProvider router={router} />);
  return { ...result, router };
}
