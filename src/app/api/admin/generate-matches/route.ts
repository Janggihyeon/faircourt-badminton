import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { generateAutoMatches, shouldWarnBeforeGenerate } from "@/lib/matchmaking/generate";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings, fetchState, nextGeneratedOrder } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { generateSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { count, force } = generateSchema.parse(await request.json());
    const settings = await ensureSettings();
    const state = await fetchState();
    const activePlayers = state.players.filter((player) => player.status === "active");
    const warning = shouldWarnBeforeGenerate(activePlayers, count);
    if (warning && !force) return jsonOk({ needsConfirmation: true, warning });

    const contextMatches = state.matches.filter((match) => ["generated", "operation_queue", "in_progress"].includes(match.status));
    const completedMatches = state.matches
      .filter((match) => match.status === "completed")
      .sort((a, b) => new Date(b.completed_at ?? b.created_at).getTime() - new Date(a.completed_at ?? a.created_at).getTime());

    const generated = generateAutoMatches({
      players: state.players,
      contextMatches,
      completedMatches,
      count,
      skillGapMode: settings.skill_gap_mode,
    });
    if (generated.length === 0) throw new Error("생성 가능한 자동 대진이 없습니다.");

    const startOrder = await nextGeneratedOrder();
    const { data, error } = await getSupabaseAdmin()
      .from("matches")
      .insert(
        generated.map((match, index) => ({
          source: "auto",
          status: "generated",
          match_type: match.match_type,
          player_ids: match.player_ids,
          generated_order: startOrder + index,
        })),
      )
      .select("*");
    if (error) throw error;
    return jsonOk({ matches: data ?? [], warning: warning ?? generated.find((match) => match.warning)?.warning ?? null });
  } catch (error) {
    return jsonError(error);
  }
}
