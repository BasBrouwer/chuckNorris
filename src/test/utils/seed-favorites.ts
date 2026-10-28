import type { Joke } from "@/types/joke";

/**
 * Pre-populates persisted favorites. The key is spelled out on purpose: it is
 * part of the stored format, so renaming it in the app should fail tests.
 */
export function seedFavorites(jokes: readonly Joke[]) {
  localStorage.setItem("chuckles:favorites", JSON.stringify(jokes));
}

export function readStoredFavorites(): unknown {
  const raw = localStorage.getItem("chuckles:favorites");
  return raw === null ? null : (JSON.parse(raw) as unknown);
}
