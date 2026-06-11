import { NextResponse } from "next/server";

export const jsonOk = <T>(data: T) => NextResponse.json(data);

export const jsonError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
  return NextResponse.json({ error: message }, { status });
};
