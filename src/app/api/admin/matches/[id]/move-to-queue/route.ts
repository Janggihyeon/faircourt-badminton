import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { appendToQueue } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    await appendToQueue(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
