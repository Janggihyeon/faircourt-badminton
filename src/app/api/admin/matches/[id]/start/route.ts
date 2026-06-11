import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings, fetchState, getMatch, reorderQueue, updatePlayersStatus } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const settings = await ensureSettings();
    const state = await fetchState();
    const inProgressMatches = state.matches.filter((match) => match.status === "in_progress" && match.id !== id);
    const inProgressCount = inProgressMatches.length;
    const match = await getMatch(id);
    const occupiedPlayerIds = new Set(inProgressMatches.flatMap((match) => match.player_ids));
    const duplicatePlayerIds = match.player_ids.filter((playerId) => occupiedPlayerIds.has(playerId));
    if (duplicatePlayerIds.length > 0) {
      const duplicateNames = state.players
        .filter((player) => duplicatePlayerIds.includes(player.id))
        .map((player) => player.name)
        .join(", ");
      throw new Error(`이미 진행 중인 경기에 포함된 참가자는 동시에 다른 코트에 들어갈 수 없습니다: ${duplicateNames}`);
    }
    const now = new Date().toISOString();

    await supabase.from("app_settings").update({ meeting_started: true, updated_at: now }).eq("id", 1);
    const { error } = await supabase
      .from("matches")
      .update({ status: "in_progress", started_at: now, operation_order: null, generated_order: null, updated_at: now })
      .eq("id", id);
    if (error) throw error;
    await updatePlayersStatus(match.player_ids, "playing");
    await reorderQueue();
    return jsonOk({
      ok: true,
      warning:
        inProgressCount >= settings.court_warning_limit
          ? "현재 진행 중인 경기가 설정된 코트 기준에 도달했습니다. 실제 사용 가능한 코트를 확인해주세요."
          : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
