import { describe, it, expect } from "vitest";
import { normalizeName, stripFences } from "@/lib/analyze-utils";

describe("normalizeName", () => {
  it("lowercases and trims", () => {
    expect(normalizeName("  Cable  ")).toBe("cable");
  });

  it("removes accents from vowels", () => {
    expect(normalizeName("Extensión de pierna")).toBe("extension de pierna");
  });

  it("removes accents from named muscles", () => {
    expect(normalizeName("Bíceps")).toBe("biceps");
  });

  it("removes parentheses and special characters", () => {
    expect(normalizeName("Cable (bajo)")).toBe("cable bajo");
  });

  it("collapses multiple internal spaces", () => {
    expect(normalizeName("polea   alta")).toBe("polea alta");
  });

  it("handles already-normalized input unchanged", () => {
    expect(normalizeName("press de banca")).toBe("press de banca");
  });

  it("produces same key regardless of accent presence", () => {
    expect(normalizeName("Máquina de pecho")).toBe(normalizeName("Maquina de pecho"));
  });
});

describe("stripFences", () => {
  it("strips ```json fences", () => {
    const input = "```json\n{\"key\":\"value\"}\n```";
    expect(stripFences(input)).toBe("{\"key\":\"value\"}");
  });

  it("strips plain ``` fences", () => {
    expect(stripFences("```\nhello\n```")).toBe("hello");
  });

  it("leaves clean JSON unchanged", () => {
    const json = "{\"isGymMachine\":true}";
    expect(stripFences(json)).toBe(json);
  });

  it("trims surrounding whitespace", () => {
    expect(stripFences("  {\"a\":1}  ")).toBe("{\"a\":1}");
  });

  it("handles single-line fenced response", () => {
    expect(stripFences("```json{\"ok\":true}```")).toBe("{\"ok\":true}");
  });
});
