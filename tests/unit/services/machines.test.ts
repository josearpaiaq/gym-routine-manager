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
  getMachineByNormalizedName,
  getMachineById,
  listMachinesPaged,
  getMachinesByMuscles,
  listAllMachinesPagedAdmin,
  setMachineActive,
} from "@/services/machines";

const machineRow = {
  id: 1,
  canonicalName: "Cable Crossover",
  normalizedName: "cable crossover",
  muscleGroups: ["Pecho", "Hombros"],
  imagePath: "https://cdn.example.com/cable.jpg",
  isGymMachine: true,
  isActive: true,
  createdAt: new Date(),
};

const exerciseRow = {
  id: 10,
  machineId: 1,
  name: "Press de pecho",
  targetMuscles: "Pecho mayor",
  execution: ["Ajusta los cables", "Agarra las manijas", "Empuja hacia adelante"],
  sortOrder: 0,
};

beforeEach(() => dbCtrl.reset());

describe("getMachineByNormalizedName", () => {
  it("returns null when machine not found", async () => {
    dbCtrl.enqueue([]); // machine SELECT
    expect(await getMachineByNormalizedName("unknown")).toBeNull();
  });

  it("returns mapped result when found", async () => {
    dbCtrl.enqueue([machineRow]);  // machine SELECT
    dbCtrl.enqueue([exerciseRow]); // exercises SELECT
    const result = await getMachineByNormalizedName("cable crossover");
    expect(result).not.toBeNull();
    expect(result!.machineName).toBe("Cable Crossover");
    expect(result!.muscleGroups).toEqual(["Pecho", "Hombros"]);
    expect(result!.exercises).toHaveLength(1);
    expect(result!.exercises[0].name).toBe("Press de pecho");
  });
});

describe("getMachineById", () => {
  it("returns null when machine not found", async () => {
    dbCtrl.enqueue([]);
    expect(await getMachineById(999)).toBeNull();
  });

  it("returns the machine with exercises", async () => {
    dbCtrl.enqueue([machineRow]);  // machine SELECT
    dbCtrl.enqueue([exerciseRow]); // exercises SELECT
    const result = await getMachineById(1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.canonical_name).toBe("Cable Crossover");
    expect(result!.exercises).toHaveLength(1);
    expect(result!.exercises[0].sort_order).toBe(0);
  });

  it("returns null image_path when not set", async () => {
    const noImage = { ...machineRow, imagePath: null };
    dbCtrl.enqueue([noImage]);
    dbCtrl.enqueue([]);
    const result = await getMachineById(1);
    expect(result!.image_path).toBeNull();
  });
});

describe("listMachinesPaged", () => {
  it("returns empty machines array and correct metadata when nothing exists", async () => {
    dbCtrl.enqueue([]);               // rows query
    dbCtrl.enqueue([{ total: 0 }]);   // count query
    const result = await listMachinesPaged(1);
    expect(result.machines).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1); // at least 1 page even when empty
  });

  it("calculates totalPages correctly", async () => {
    const rows = [machineRow];
    dbCtrl.enqueue(rows);
    dbCtrl.enqueue([{ total: 25 }]);
    const result = await listMachinesPaged(1, 10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(1);
  });

  it("maps rows to the expected shape", async () => {
    dbCtrl.enqueue([machineRow]);
    dbCtrl.enqueue([{ total: 1 }]);
    const result = await listMachinesPaged(1, 10);
    expect(result.machines[0]).toMatchObject({
      id: 1,
      canonical_name: "Cable Crossover",
      muscle_groups: ["Pecho", "Hombros"],
    });
  });
});

describe("getMachinesByMuscles", () => {
  it("returns empty array when no muscles provided", async () => {
    expect(await getMachinesByMuscles([])).toEqual([]);
  });

  it("filters machines by matching muscle group (case-insensitive)", async () => {
    const allMachines = [
      { ...machineRow, id: 1, canonicalName: "Cable", normalizedName: "cable", muscleGroups: ["Pecho"] },
      { ...machineRow, id: 2, canonicalName: "Curl", normalizedName: "curl", muscleGroups: ["Bíceps"] },
    ];
    dbCtrl.enqueue(allMachines);
    const result = await getMachinesByMuscles(["pecho"]);
    expect(result).toHaveLength(1);
    expect(result[0].canonical_name).toBe("Cable");
  });

  it("matches regardless of input case", async () => {
    dbCtrl.enqueue([machineRow]);
    const result = await getMachinesByMuscles(["PECHO"]);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no machines match", async () => {
    dbCtrl.enqueue([machineRow]);
    const result = await getMachinesByMuscles(["Piernas"]);
    expect(result).toHaveLength(0);
  });
});

describe("listAllMachinesPagedAdmin", () => {
  it("returns all machines including inactive, with correct metadata", async () => {
    const inactive = { ...machineRow, id: 2, isActive: false };
    dbCtrl.enqueue([machineRow, inactive]);
    dbCtrl.enqueue([{ total: 2 }]);
    const result = await listAllMachinesPagedAdmin(1);
    expect(result.machines).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.machines[1].is_active).toBe(false);
  });

  it("calculates totalPages correctly", async () => {
    dbCtrl.enqueue([machineRow]);
    dbCtrl.enqueue([{ total: 40 }]);
    const result = await listAllMachinesPagedAdmin(1, 20);
    expect(result.totalPages).toBe(2);
  });
});

describe("setMachineActive", () => {
  it("resolves without error when deactivating", async () => {
    dbCtrl.enqueue([]);
    await expect(setMachineActive(1, false)).resolves.not.toThrow();
  });

  it("resolves without error when activating", async () => {
    dbCtrl.enqueue([]);
    await expect(setMachineActive(1, true)).resolves.not.toThrow();
  });
});
