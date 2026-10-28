/**
 * Creates a factory that returns a fresh object on every call, with `overrides`
 * shallow-merged over the defaults: an override replaces a whole top-level property,
 * nested objects and arrays included.
 *
 * `getDefaults` is a function (not a plain object) on purpose: it runs per call,
 * so nested objects, sequence ids and `vi.fn()` mocks are never shared between
 * the objects a factory produces, and overrides can never leak into later tests.
 *
 * With `exactOptionalPropertyTypes`, `undefined` is rejected for required properties.
 *
 * @example
 * const createUser = createFactory(() => ({ id: nextId(), profile: { name: "Ada" } }));
 * createUser({ profile: { name: "Grace" } });
 */
export function createFactory<T extends object>(getDefaults: () => T) {
  return (overrides?: Partial<T>): T => ({ ...getDefaults(), ...overrides });
}

/** Builds `count` objects from a factory, applying the same overrides to each. */
export function createMany<T, O>(factory: (overrides?: O) => T, count: number, overrides?: O): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}

/** Returns a generator of unique, readable ids: `joke-1`, `joke-2`, ... */
export function createSequence(prefix: string): () => string {
  let current = 0;
  return () => {
    current += 1;
    return `${prefix}-${current}`;
  };
}
