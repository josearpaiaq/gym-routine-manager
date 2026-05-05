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
    },
  };
});

import { createOtp, verifyOtp } from "@/services/otp";

beforeEach(() => dbCtrl.reset());

describe("createOtp", () => {
  it("resolves without error", async () => {
    dbCtrl.enqueue([]); // update (mark old OTPs used)
    dbCtrl.enqueue([]); // insert new OTP
    const expiresAt = new Date(Date.now() + 600_000);
    await expect(createOtp("user@example.com", "123456", expiresAt)).resolves.not.toThrow();
  });
});

describe("verifyOtp", () => {
  it("returns false when OTP not found", async () => {
    dbCtrl.enqueue([]); // SELECT returns no rows
    expect(await verifyOtp("user@example.com", "000000")).toBe(false);
  });

  it("returns false when OTP is expired", async () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second in the past
    const expiredOtp = { id: 1, email: "user@example.com", code: "123456", expiresAt: pastDate, used: false };
    dbCtrl.enqueue([expiredOtp]); // SELECT returns expired row
    expect(await verifyOtp("user@example.com", "123456")).toBe(false);
  });

  it("returns true and marks OTP used when valid", async () => {
    const futureDate = new Date(Date.now() + 600_000);
    const validOtp = { id: 1, email: "user@example.com", code: "654321", expiresAt: futureDate, used: false };
    dbCtrl.enqueue([validOtp]); // SELECT returns the valid OTP
    dbCtrl.enqueue([]);         // UPDATE (mark used) succeeds
    expect(await verifyOtp("user@example.com", "654321")).toBe(true);
  });
});
