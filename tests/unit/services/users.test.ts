import { describe, it, expect, vi, beforeEach } from "vitest";

const dbCtrl = vi.hoisted(() => {
  const queue: unknown[][] = [];
  return {
    enqueue: (rows: unknown[]) => queue.push(rows),
    dequeue: () => (queue.length > 0 ? queue.shift()! : []),
    reset: () => {
      queue.length = 0;
    },
  };
});

vi.mock("@/db", () => {
  function makeChain() {
    const chain: Record<string, unknown> = {};
    for (const m of [
      "from","where","set","values","returning","orderBy","limit",
      "offset","innerJoin","onConflictDoUpdate",
    ]) {
      chain[m] = () => chain;
    }
    chain.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(dbCtrl.dequeue()).then(res, rej);
    return chain;
  }
  return {
    db: {
      select: () => makeChain(),
      insert: () => makeChain(),
      update: () => makeChain(),
      delete: () => makeChain(),
      transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          select: () => makeChain(),
          insert: () => makeChain(),
          update: () => makeChain(),
          delete: () => makeChain(),
        };
        return cb(tx);
      },
    },
  };
});

import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByUsernameOrEmail,
  markEmailVerified,
  updatePasswordHash,
  deleteUser,
} from "@/services/users";

const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  passwordHash: "hashed",
  emailVerified: false,
  analyzerEnabled: false,
  createdAt: new Date(),
};

beforeEach(() => dbCtrl.reset());

describe("getUserByEmail", () => {
  it("returns null when user not found", async () => {
    dbCtrl.enqueue([]);
    expect(await getUserByEmail("missing@example.com")).toBeNull();
  });

  it("returns the user when found", async () => {
    dbCtrl.enqueue([mockUser]);
    expect(await getUserByEmail("test@example.com")).toEqual(mockUser);
  });
});

describe("getUserById", () => {
  it("returns null when user not found", async () => {
    dbCtrl.enqueue([]);
    expect(await getUserById(999)).toBeNull();
  });

  it("returns the user when found", async () => {
    dbCtrl.enqueue([mockUser]);
    expect(await getUserById(1)).toEqual(mockUser);
  });
});

describe("getUserByUsernameOrEmail", () => {
  it("returns null when no match", async () => {
    dbCtrl.enqueue([]);
    expect(await getUserByUsernameOrEmail("nobody")).toBeNull();
  });

  it("returns the user on match", async () => {
    dbCtrl.enqueue([mockUser]);
    expect(await getUserByUsernameOrEmail("testuser")).toEqual(mockUser);
  });
});

describe("createUser", () => {
  it("returns the inserted user row", async () => {
    dbCtrl.enqueue([mockUser]);
    const result = await createUser("testuser", "test@example.com", "hash");
    expect(result).toEqual(mockUser);
  });
});

describe("markEmailVerified", () => {
  it("resolves without error", async () => {
    dbCtrl.enqueue([]);
    await expect(markEmailVerified("test@example.com")).resolves.not.toThrow();
  });
});

describe("updatePasswordHash", () => {
  it("resolves without error", async () => {
    dbCtrl.enqueue([]);
    await expect(updatePasswordHash("test@example.com", "newHash")).resolves.not.toThrow();
  });
});

describe("deleteUser", () => {
  it("resolves without error", async () => {
    dbCtrl.enqueue([]);
    await expect(deleteUser(1)).resolves.not.toThrow();
  });
});
