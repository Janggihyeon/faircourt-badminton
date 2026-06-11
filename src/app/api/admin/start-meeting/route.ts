import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    await ensureSettings();
    const { error } = await getSupabaseAdmin()
      .from("app_settings")
      .update({ meeting_started: true, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
