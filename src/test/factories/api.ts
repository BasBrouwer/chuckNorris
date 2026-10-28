import { createFactory } from "./createFactory";

/**
 * Shape of `GET https://api.chucknorris.io/jokes/random`, verified against live
 * responses, e.g.:
 * {
 *   "categories": [],
 *   "created_at": "2020-01-05 13:42:26.766831",
 *   "icon_url": "https://api.chucknorris.io/img/avatar/chuck-norris.png",
 *   "id": "7jQI7x4dQVOTQFKyNvgpOg",
 *   "updated_at": "2020-01-05 13:42:26.766831",
 *   "url": "https://api.chucknorris.io/jokes/7jQI7x4dQVOTQFKyNvgpOg",
 *   "value": "Chuck Norris smokes chains."
 * }
 */
export interface RandomJokeResponse {
  categories: string[];
  created_at: string;
  icon_url: string;
  id: string;
  updated_at: string;
  url: string;
  value: string;
}

// Real jokes from the API, cycled so generated responses read like real ones.
const REAL_JOKES = [
  "Chuck Norris smokes chains.",
  "Chuck Norris uses an F5 tornado to mop the blood off his palace floors.",
  "If Chuck Norris ate at your restaurant and had only $5 for his $50 meal, you would still owe him change.",
  "The thing worst than Chuck Norris is death...wait...I got it backwards.",
  "Chuck Norris can access the DB from the UI.",
];

let sequence = 0;

/** Readable 22-char id in the API's format (`^[A-Za-z0-9_-]{22}$`), unique per sequence number. */
function createApiId(n: number): string {
  return `joke${String(n).padStart(18, "0")}`;
}

/** `2020-01-05 13:42:SS.ffffff`, unique per sequence number like the live data. */
function createApiTimestamp(n: number): string {
  const seconds = String(n % 60).padStart(2, "0");
  const micros = String((n * 7919) % 1_000_000).padStart(6, "0");
  return `2020-01-05 13:42:${seconds}.${micros}`;
}

/** Cycles the real jokes, adding a counter after the first lap so every value is unique. */
function createValue(n: number): string {
  const base = REAL_JOKES[n % REAL_JOKES.length] ?? "Chuck Norris smokes chains.";
  const lap = Math.floor(n / REAL_JOKES.length);
  return lap === 0 ? base : `${base} (${String(lap + 1)})`;
}

const createBase = createFactory<RandomJokeResponse>(() => {
  sequence += 1;
  const id = createApiId(sequence);
  const timestamp = createApiTimestamp(sequence);
  return {
    categories: [],
    created_at: timestamp,
    icon_url: "https://api.chucknorris.io/img/avatar/chuck-norris.png",
    id,
    updated_at: timestamp,
    url: `https://api.chucknorris.io/jokes/${id}`,
    value: createValue(sequence),
  };
});

/**
 * Builds an API response. Like the real API, `url` always points at the joke's
 * `id`, so overriding `id` keeps `url` consistent unless `url` is overridden too.
 */
export function createRandomJokeResponse(
  overrides?: Partial<RandomJokeResponse>,
): RandomJokeResponse {
  const response = createBase(overrides);
  if (overrides?.id !== undefined && overrides.url === undefined) {
    response.url = `https://api.chucknorris.io/jokes/${overrides.id}`;
  }
  return response;
}
