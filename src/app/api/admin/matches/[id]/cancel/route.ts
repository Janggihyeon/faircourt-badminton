import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { reorderQueue } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const { error } = await getSupabaseAdmin()
      .from("matches")
      .update({ status: "cancelled", operation_order: null, generated_order: null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    await reorderQueue();
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
