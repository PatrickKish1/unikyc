/* eslint-disable @typescript-eslint/no-explicit-any */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SiweMessage, generateNonce as siweGenerateNonce } from "siwe";
import { redis } from "../redis";

const SESSION_COOKIE = "unikyc_sid";
const NONCE_TTL_SECONDS = 5 * 60; // 5 minutes
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function randomId(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

async function getOrCreateSid(): Promise<string> {
  const store = await cookies();
  let sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) {
    sid = randomId();
    store.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return sid;
}

// In-memory fallback for local dev without Redis
const memoryStore = new Map<string, any>();

async function kvSet(key: string, value: any, ttlSeconds?: number) {
  if (redis) {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return;
  }
  memoryStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined });
}

async function kvGet<T = any>(key: string): Promise<T | null> {
  if (redis) {
    return ((await redis.get(key)) as T) ?? null;
  }
  const rec = memoryStore.get(key);
  if (!rec) return null;
  if (rec.expiresAt && Date.now() > rec.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return rec.value as T;
}

export async function issueNonce(): Promise<{ sid: string; nonce: string }> {
  const sid = await getOrCreateSid();
  const nonce = siweGenerateNonce();
  await kvSet(`nonce:${sid}`, nonce, NONCE_TTL_SECONDS);
  return { sid, nonce };
}

export type SiweSession = {
  address: `0x${string}`;
  chainId: number;
  ensName?: string | null;
  issuedAt: string;
  expirationTime?: string;
};

export async function verifySiwe(message: string, signature: string, req: NextRequest): Promise<SiweSession> {
  const siwe = new SiweMessage(message);
  const sid = req.cookies.get(SESSION_COOKIE)?.value || getOrCreateSid();
  const expectedNonce = await kvGet<string>(`nonce:${sid}`);
  if (!expectedNonce) {
    throw new Error("Missing or expired nonce");
  }

  const result = await siwe.verify({ signature, nonce: expectedNonce });
  if (!result.success) {
    throw new Error(result.error?.type || "Invalid signature");
  }

  const session: SiweSession = {
    address: siwe.address as `0x${string}`,
    chainId: Number(siwe.chainId),
    issuedAt: siwe.issuedAt ?? new Date().toISOString(),
    expirationTime: siwe.expirationTime,
  };

  await kvSet(`session:${sid}`, session, SESSION_TTL_SECONDS);
  // Invalidate nonce after use
  await kvSet(`nonce:${sid}`, null, 1);
  return session;
}

export async function getSession(): Promise<SiweSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('siwe-session')
  if (!sessionCookie) {
    return null
  }

  const sessionId = sessionCookie.value
  return (await kvGet<SiweSession>(`session:${sessionId}`)) ?? null;
}
