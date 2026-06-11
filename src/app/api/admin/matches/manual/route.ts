import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlayersByIds, nextQueueOrder } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { matchPlayerIdsSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const { player_ids } = matchPlayerIdsSchema.parse(body);
    if (new Set(player_ids).size !== 4) throw new Error("한 대진에 같은 참가자를 중복 선택할 수 없습니다.");
    const players = await getPlayersByIds(player_ids);
    if (players.length !== 4) throw new Error("선택한 참가자를 찾을 수 없습니다.");
    const status = body.status === "operation_queue" ? "operation_queue" : "generated";
    const operation_order = status === "operation_queue" ? await nextQueueOrder() : null;
    const warnings = players
      .filter((player) => player.status !== "active")
      .map((player) => `${player.name}(${player.status})`);
    const { data, error } = await getSupabaseAdmin()
      .from("matches")
      .insert({
        source: "manual",
        status,
        match_type: "manual",
        player_ids,
        operation_order,
      })
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk({ match: data, warning: warnings.length ? `주의가 필요한 참가자: ${warnings.join(", ")}` : null });
  } catch (error) {
    return jsonError(error);
  }
}
