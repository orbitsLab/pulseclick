import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-super-secret-habit-tracker-key-2026";
const key = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "habit_token";

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionAuth(): Promise<{ id: string; email: string } | null> {
  try {
    await connection();
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySession(token);
    if (!session || !session.userId) return null;

    return { id: session.userId, email: session.email };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    // With Cache Components enabled the session must only be resolved for a real
    // request; `connection()` stops the prerender from continuing.
    await connection();

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySession(token);
    if (!session || !session.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return user;
  } catch (error) {
    // No session context (for example while prerendering a route).
    return null;
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
