import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/auth/admin-session";
import { jsonError } from "@/lib/server/responses";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!process.env.ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD가 설정되지 않았습니다.");
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    setAdminCookie(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
