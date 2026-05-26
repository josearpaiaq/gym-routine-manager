import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { signSession, verifySession, signResetToken, verifyResetToken } from "@/lib/auth";

const testPayload = { userId: 42, email: "test@example.com", username: "testuser", isAdmin: false };

describe("signSession / verifySession", () => {
  it("round-trips a session payload", async () => {
    const token = await signSession(testPayload);
    const result = await verifySession(token);
    expect(result?.userId).toBe(testPayload.userId);
    expect(result?.email).toBe(testPayload.email);
    expect(result?.username).toBe(testPayload.username);
  });

  it("returns null for a garbage token", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signSession(testPayload);
    expect(await verifySession(token + "x")).toBeNull();
  });

  it("includes all three payload fields", async () => {
    const token = await signSession(testPayload);
    const result = await verifySession(token);
    expect(result).toMatchObject(testPayload);
  });
});

describe("signResetToken / verifyResetToken", () => {
  const email = "reset@example.com";

  it("round-trips a reset token and returns the email", async () => {
    const token = await signResetToken(email);
    const result = await verifyResetToken(token);
    expect(result).toBe(email);
  });

  it("returns null for a garbage token", async () => {
    expect(await verifyResetToken("not-a-jwt")).toBeNull();
  });

  it("returns null for a session token (wrong purpose)", async () => {
    const sessionToken = await signSession(testPayload);
    expect(await verifyResetToken(sessionToken)).toBeNull();
  });

  it("returns null for an empty string", async () => {
    expect(await verifyResetToken("")).toBeNull();
  });
});
