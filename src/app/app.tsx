import { RouterProvider } from "@tanstack/react-router";

import { router as defaultRouter } from "./router";

interface AppProps {
  /** Defaults to the app's router; tests inject an isolated one. */
  router?: typeof defaultRouter;
}

export function App({ router = defaultRouter }: AppProps) {
  return <RouterProvider router={router} />;
}
