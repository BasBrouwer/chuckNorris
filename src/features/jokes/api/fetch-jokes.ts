import type { Joke } from "@/types/joke";

const RANDOM_JOKE_URL = "https://api.chucknorris.io/jokes/random";

interface RandomJokeResponse {
  id: string;
  value: string;
}

function isRandomJokeResponse(data: unknown): data is RandomJokeResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof data.id === "string" &&
    "value" in data &&
    typeof data.value === "string"
  );
}

export async function fetchJoke(signal: AbortSignal): Promise<Joke> {
  const response = await fetch(RANDOM_JOKE_URL, { signal });
  if (!response.ok) {
    throw new Error(`Joke request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isRandomJokeResponse(data)) {
    throw new Error("Joke response has an unexpected shape");
  }

  return { id: data.id, text: data.value };
}

/**
 * Fetches `count` random jokes in parallel. The API has no batch endpoint, so
 * duplicates are dropped and individual failures are tolerated; it only throws
 * when no joke could be loaded (or the request was aborted).
 */
export async function fetchJokes(count: number, signal: AbortSignal): Promise<Joke[]> {
  const results = await Promise.allSettled(Array.from({ length: count }, () => fetchJoke(signal)));
  signal.throwIfAborted();

  const jokes = new Map<string, Joke>();
  for (const result of results) {
    if (result.status === "fulfilled") {
      jokes.set(result.value.id, result.value);
    }
  }

  if (jokes.size === 0) {
    throw new Error("Could not load any jokes");
  }
  return [...jokes.values()];
}
