import { useEffect, useRef, useState } from "react";

import type { Joke } from "@/types/joke";

import { fetchJoke, fetchJokes } from "../api/fetch-jokes";

export const MAX_JOKES = 10;
export const AUTO_REFRESH_INTERVAL_MS = 5000;
/** How long a joke that arrived on a timer tick stays highlighted as new. */
export const FRESH_DURATION_MS = 2000;

/**
 * The API's own `created_at` / `updated_at` are not usable for ordering (they
 * are old and near-identical), so a joke's age is when we received it.
 */
export interface TimedJoke extends Joke {
  receivedAt: number;
}

type Status = "loading" | "success" | "error";

interface UseJokesOptions {
  /** While true, one new joke is fetched every AUTO_REFRESH_INTERVAL_MS. */
  autoRefresh: boolean;
}

/** Dedupes by id, sorts newest first and drops the oldest beyond MAX_JOKES. */
function mergeJokes(current: readonly TimedJoke[], incoming: readonly TimedJoke[]): TimedJoke[] {
  const byId = new Map<string, TimedJoke>();
  // Current first: a joke fetched again keeps its original position and time.
  for (const joke of [...current, ...incoming]) {
    if (!byId.has(joke.id)) {
      byId.set(joke.id, joke);
    }
  }
  return [...byId.values()].sort((a, b) => b.receivedAt - a.receivedAt).slice(0, MAX_JOKES);
}

/**
 * The initial batch is spread over a time frame as if one joke had arrived every
 * interval, ending now, so that it has a defined order relative to later arrivals.
 */
function timeBatch(jokes: readonly Joke[], now: number): TimedJoke[] {
  return jokes.map((joke, index) => ({
    ...joke,
    receivedAt: now - (jokes.length - 1 - index) * AUTO_REFRESH_INTERVAL_MS,
  }));
}

export function useJokes({ autoRefresh }: UseJokesOptions) {
  const [jokes, setJokes] = useState<readonly TimedJoke[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadId, setLoadId] = useState(0);
  // Ids of tick jokes still inside their highlight window.
  const [freshIds, setFreshIds] = useState<readonly string[]>([]);
  // The interval callback outlives renders, so it reads the latest list through a ref.
  const jokesRef = useRef(jokes);
  const freshTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    jokesRef.current = jokes;
  }, [jokes]);

  useEffect(() => {
    const timers = freshTimers.current;
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  // Batch load: on mount, and again only when the user retries after a failure.
  useEffect(() => {
    const controller = new AbortController();

    fetchJokes(MAX_JOKES, controller.signal).then(
      (batch) => {
        setJokes((current) => mergeJokes(current, timeBatch(batch, Date.now())));
        setStatus("success");
      },
      (error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        console.error(error);
        setStatus("error");
      },
    );

    return () => {
      controller.abort();
    };
  }, [loadId]);

  // Timer: while on, add a single new joke per tick.
  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const controller = new AbortController();

    const intervalId = setInterval(() => {
      fetchJoke(controller.signal).then(
        (joke) => {
          if (jokesRef.current.some((existing) => existing.id === joke.id)) {
            return;
          }
          setJokes((current) => mergeJokes(current, [{ ...joke, receivedAt: Date.now() }]));
          setFreshIds((ids) => [...ids, joke.id]);
          const timer = setTimeout(() => {
            freshTimers.current.delete(timer);
            setFreshIds((ids) => ids.filter((id) => id !== joke.id));
          }, FRESH_DURATION_MS);
          freshTimers.current.add(timer);
        },
        (error: unknown) => {
          if (!controller.signal.aborted) {
            console.error(error);
          }
        },
      );
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [autoRefresh]);

  function retry() {
    setStatus("loading");
    setLoadId((id) => id + 1);
  }

  return { jokes, status, retry, freshIds };
}
