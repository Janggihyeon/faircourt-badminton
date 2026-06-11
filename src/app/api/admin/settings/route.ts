import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { settingsSchema } from "@/lib/server/validation";

export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    await ensureSettings();
    const payload = settingsSchema.parse(await request.json());
    const { data, error } = await getSupabaseAdmin()
      .from("app_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk({ settings: data });
  } catch (error) {
    return jsonError(error);
  }
}
