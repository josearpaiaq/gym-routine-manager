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
  listRoutinesByUser,
  getRoutineByIdForUser,
  deleteRoutine,
  getDayMachines,
  removeDayMachine,
} from "@/services/routines";

const routineRow = {
  id: 1,
  userId: 42,
  name: "Rutina de fuerza",
  createdAt: new Date("2024-01-15"),
};

const dayRow = {
  id: 10,
  routineId: 1,
  dayNumber: 1,
  name: "Día de pecho",
  targetMuscles: ["Pecho", "Tríceps"],
  sortOrder: 0,
};

beforeEach(() => dbCtrl.reset());

describe("listRoutinesByUser", () => {
  it("returns empty array when user has no routines", async () => {
    dbCtrl.enqueue([]); // SELECT routines
    expect(await listRoutinesByUser(99)).toEqual([]);
  });

  it("returns routines with their days", async () => {
    dbCtrl.enqueue([routineRow]); // SELECT routines
    dbCtrl.enqueue([dayRow]);     // SELECT days for routine 1
    const result = await listRoutinesByUser(42);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Rutina de fuerza");
    expect(result[0].days).toHaveLength(1);
    expect(result[0].days[0].name).toBe("Día de pecho");
  });
});

describe("getRoutineByIdForUser", () => {
  it("returns null when routine not found", async () => {
    dbCtrl.enqueue([]); // SELECT routine
    expect(await getRoutineByIdForUser(999, 42)).toBeNull();
  });

  it("returns the routine when owned by user", async () => {
    dbCtrl.enqueue([routineRow]); // SELECT routine
    dbCtrl.enqueue([dayRow]);     // SELECT days
    const result = await getRoutineByIdForUser(1, 42);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.days).toHaveLength(1);
  });
});

describe("deleteRoutine", () => {
  it("returns false when routine doesn't belong to user", async () => {
    dbCtrl.enqueue([]); // DELETE returns nothing (no rows affected)
    expect(await deleteRoutine(1, 99)).toBe(false);
  });

  it("returns true when routine is deleted", async () => {
    dbCtrl.enqueue([{ id: 1 }]); // DELETE returns deleted row
    expect(await deleteRoutine(1, 42)).toBe(true);
  });
});

describe("getDayMachines", () => {
  it("returns empty array when user doesn't own the day", async () => {
    dbCtrl.enqueue([]); // verifyDayOwnership SELECT returns nothing
    expect(await getDayMachines(10, 99)).toEqual([]);
  });

  it("returns machines when ownership is confirmed", async () => {
    const assignedMachine = {
      id: 5,
      machineId: 1,
      name: "Cable Crossover",
      sets: 3,
      reps: "12",
      weightKg: "25.00",
      restSeconds: 90,
      notes: null,
      sortOrder: 0,
    };
    dbCtrl.enqueue([{ id: 10 }]);         // verifyDayOwnership — row found
    dbCtrl.enqueue([assignedMachine]);     // getDayMachines SELECT
    const result = await getDayMachines(10, 42);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Cable Crossover");
    expect(result[0].sets).toBe(3);
  });
});

describe("removeDayMachine", () => {
  it("returns false when user doesn't own the day", async () => {
    dbCtrl.enqueue([]); // verifyDayOwnership returns nothing
    expect(await removeDayMachine(10, 1, 99)).toBe(false);
  });

  it("returns false when machine not found in day", async () => {
    dbCtrl.enqueue([{ id: 10 }]); // verifyDayOwnership passes
    dbCtrl.enqueue([]);            // DELETE returns nothing
    expect(await removeDayMachine(10, 999, 42)).toBe(false);
  });

  it("returns true when machine is removed", async () => {
    dbCtrl.enqueue([{ id: 10 }]); // verifyDayOwnership passes
    dbCtrl.enqueue([{ id: 5 }]);  // DELETE returns deleted row
    expect(await removeDayMachine(10, 1, 42)).toBe(true);
  });
});
