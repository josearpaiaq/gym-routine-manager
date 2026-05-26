import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "gym_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);

export interface SessionPayload {
  userId: number;
  email: string;
  username: string;
  isAdmin: boolean;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

const RESET_COOKIE_NAME = "pw_reset_token";

export async function signResetToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "pw-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "pw-reset" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

export async function setResetCookie(email: string): Promise<void> {
  const token = await signResetToken(email);
  const jar = await cookies();
  jar.set(RESET_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });
}

export async function clearResetCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(RESET_COOKIE_NAME);
}

export async function getResetEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(RESET_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyResetToken(token);
}
