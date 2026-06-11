import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "shuttle_bus_admin";
const MAX_AGE = 60 * 60 * 12;

const getSecret = () => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET이 설정되지 않았습니다.");
  return secret;
};

const sign = (payload: string) =>
  createHmac("sha256", getSecret()).update(payload).digest("base64url");

export const createAdminToken = () => {
  const payload = JSON.stringify({ role: "admin", iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
};

export const verifyAdminToken = (token?: string) => {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  const expected = sign(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
};

export const isAdminRequest = async () => {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value);
};

export const requireAdmin = async () => {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  return null;
};

export const setAdminCookie = (response: NextResponse) => {
  response.cookies.set(COOKIE_NAME, createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
};

export const clearAdminCookie = (response: NextResponse) => {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
