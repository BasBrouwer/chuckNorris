import { http, HttpResponse } from "msw";

import { createRandomJokeResponse } from "../factories";

/** Declared here on purpose (not imported from the app) so a URL change in the app fails tests. */
export const RANDOM_JOKE_URL = "https://api.chucknorris.io/jokes/random";

/** Happy-path defaults. Override per test with `server.use(...)`. */
export const handlers = [
  http.get(RANDOM_JOKE_URL, () => HttpResponse.json(createRandomJokeResponse())),
];
