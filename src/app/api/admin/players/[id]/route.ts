import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { playerSchema } from "@/lib/server/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const payload = playerSchema.partial().parse(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("players")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk({ player: data });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const settings = await ensureSettings();
    if (settings.meeting_started) throw new Error("모임 시작 후에는 참가자를 삭제할 수 없습니다.");
    const { id } = await context.params;
    const { error } = await getSupabaseAdmin().from("players").delete().eq("id", id);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
