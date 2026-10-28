import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./mocks";

// main.tsx renders inside <StrictMode>; render tests the same way so effects run (and clean up) twice.
configure({ reactStrictMode: true });

// jsdom does not implement scrolling; the router calls it for scroll restoration.
window.scrollTo = () => undefined;

beforeAll(() => {
  // fetch is stubbed: nothing reaches the network, and unhandled requests fail the test.
  server.listen();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  server.assertNoUnhandledRequests();
});

afterAll(() => {
  server.close();
});
