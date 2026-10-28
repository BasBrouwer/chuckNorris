import type { Joke } from "@/types/joke";

import { createFactory, createMany, createSequence } from "./createFactory";

const nextJokeId = createSequence("joke");

export const createJoke = createFactory<Joke>(() => {
  const id = nextJokeId();
  return { id, text: `Chuck Norris test joke ${id}.` };
});

export function createJokes(count: number, overrides?: Partial<Joke>): Joke[] {
  return createMany(createJoke, count, overrides);
}
