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
  listAllUsers,
  updateUserById,
} from "@/services/users";

const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  passwordHash: "hashed",
  emailVerified: false,
  analyzerEnabled: false,
  isAdmin: false,
  isEnabled: true,
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

describe("listAllUsers", () => {
  it("returns all users ordered by createdAt", async () => {
    const secondUser = { ...mockUser, id: 2, username: "other" };
    dbCtrl.enqueue([mockUser, secondUser]);
    const result = await listAllUsers();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it("returns empty array when no users", async () => {
    dbCtrl.enqueue([]);
    const result = await listAllUsers();
    expect(result).toEqual([]);
  });
});

describe("updateUserById", () => {
  it("resolves without error when toggling isEnabled", async () => {
    dbCtrl.enqueue([]);
    await expect(updateUserById(1, { isEnabled: false })).resolves.not.toThrow();
  });

  it("resolves without error when toggling analyzerEnabled", async () => {
    dbCtrl.enqueue([]);
    await expect(updateUserById(1, { analyzerEnabled: true })).resolves.not.toThrow();
  });

  it("resolves without error when toggling isAdmin", async () => {
    dbCtrl.enqueue([]);
    await expect(updateUserById(1, { isAdmin: true })).resolves.not.toThrow();
  });
});
