import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json().catch(() => ({}));
    const keepPlayers = Boolean(body.keepPlayers);
    await supabase.from("matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (keepPlayers) {
      const { error: playersError } = await supabase
        .from("players")
        .update({ games_played: 0, last_played_at: null, updated_at: new Date().toISOString() })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (playersError) throw playersError;
    } else {
      await supabase.from("players").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    await ensureSettings();
    const { error } = await supabase
      .from("app_settings")
      .update({
        meeting_started: false,
        court_warning_limit: 2,
        skill_gap_mode: "normal",
        auto_generation_default_count: 2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error, 500);
  }
}
