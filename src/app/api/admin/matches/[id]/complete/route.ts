import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getMatch, getPlayersByIds } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await context.params;
    const supabase = getSupabaseAdmin();
    const match = await getMatch(id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("matches")
      .update({ status: "completed", completed_at: now, updated_at: now })
      .eq("id", id);
    if (error) throw error;

    const players = await getPlayersByIds(match.player_ids);
    for (const player of players) {
      const nextStatus = player.status === "playing" ? "active" : player.status;
      const { error: playerError } = await supabase
        .from("players")
        .update({
          games_played: player.games_played + 1,
          last_played_at: now,
          status: nextStatus,
          updated_at: now,
        })
        .eq("id", player.id);
      if (playerError) throw playerError;
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
