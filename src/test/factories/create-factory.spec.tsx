import { describe, expect, it, vi } from "vitest";

import { createFactory, createMany, createSequence } from "./create-factory";

interface User {
  id: string;
  profile: { name: string; address: { city: string } };
  tags: string[];
  onSave: () => void;
  nickname?: string;
}

const createUser = createFactory<User>(() => ({
  id: "user-1",
  profile: { name: "Ada", address: { city: "London" } },
  tags: ["admin"],
  onSave: vi.fn(),
}));

describe("createFactory", () => {
  it("returns the defaults when no overrides are given", () => {
    expect(createUser()).toMatchObject({ id: "user-1", profile: { name: "Ada" } });
  });

  it("applies overrides over the defaults", () => {
    const user = createUser({ id: "user-2", tags: ["guest"] });

    expect(user).toMatchObject({ id: "user-2", tags: ["guest"] });
  });

  it("replaces an overridden top-level object wholesale instead of merging into it", () => {
    const user = createUser({ profile: { name: "Grace", address: { city: "Paris" } } });

    expect(user.profile).toEqual({ name: "Grace", address: { city: "Paris" } });
  });

  it("lets an override replace a function default", () => {
    const onSave = vi.fn();

    const user = createUser({ onSave });
    user.onSave();

    expect(onSave).toHaveBeenCalledOnce();
  });

  it("does not let overrides leak into later calls", () => {
    createUser({ id: "user-2", profile: { name: "Grace", address: { city: "Paris" } } });

    expect(createUser()).toMatchObject({
      id: "user-1",
      profile: { name: "Ada", address: { city: "London" } },
    });
  });

  it("gives every call its own nested objects and mocks", () => {
    const first = createUser();
    const second = createUser();

    first.profile.name = "Changed";
    first.onSave();

    expect(second.profile.name).toBe("Ada");
    expect(second.onSave).not.toHaveBeenCalled();
    expect(first.onSave).not.toBe(second.onSave);
  });

  it("rejects clearing a required property at compile time", () => {
    // @ts-expect-error id is required, so undefined is not an allowed override
    const user = createUser({ id: undefined });

    expect(user).toBeDefined();
  });
});

describe("createMany", () => {
  it("builds the requested number of independent objects with shared overrides", () => {
    const users = createMany(createUser, 3, { tags: ["guest"] });

    expect(users).toHaveLength(3);
    expect(users.every((user) => user.tags[0] === "guest")).toBe(true);
    expect(new Set(users.map((user) => user.profile)).size).toBe(3);
  });
});

describe("createSequence", () => {
  it("yields unique, prefixed ids", () => {
    const next = createSequence("joke");

    expect([next(), next(), next()]).toEqual(["joke-1", "joke-2", "joke-3"]);
  });

  it("keeps separate counters per sequence", () => {
    const a = createSequence("a");
    const b = createSequence("b");
    a();

    expect(b()).toBe("b-1");
  });
});
