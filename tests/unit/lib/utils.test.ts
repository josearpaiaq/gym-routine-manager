import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("deduplicates conflicting tailwind classes (last wins)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("filters falsy values", () => {
    expect(cn("a", undefined, false as unknown as string, null as unknown as string, "b")).toBe(
      "a b"
    );
  });

  it("handles conditional class objects", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});
