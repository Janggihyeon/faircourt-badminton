import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlayersByIds } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { matchPlayerIdsSchema } from "@/lib/server/validation";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const { player_ids } = matchPlayerIdsSchema.parse(await request.json());
    if (new Set(player_ids).size !== 4) throw new Error("한 대진에 같은 참가자를 중복 선택할 수 없습니다.");
    const players = await getPlayersByIds(player_ids);
    if (players.length !== 4) throw new Error("선택한 참가자를 찾을 수 없습니다.");
    const { data, error } = await getSupabaseAdmin()
      .from("matches")
      .update({ player_ids, match_type: "manual", source: "manual", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk({ match: data });
  } catch (error) {
    return jsonError(error);
  }
}
