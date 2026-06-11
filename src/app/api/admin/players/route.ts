import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureSettings } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { playerSchema } from "@/lib/server/validation";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { data, error } = await getSupabaseAdmin().from("players").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return jsonOk({ players: data ?? [] });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const settings = await ensureSettings();
    const payload = playerSchema.parse(await request.json());
    const status = payload.status ?? (settings.meeting_started ? "not_arrived" : "not_arrived");
    const { data, error } = await getSupabaseAdmin()
      .from("players")
      .insert({ name: payload.name, gender: payload.gender, skill: payload.skill, status })
      .select("*")
      .single();
    if (error) throw error;
    return jsonOk({ player: data, warning: settings.meeting_started ? "모임이 이미 시작된 상태입니다. 새로 추가된 참가자는 이후 새로 생성되는 대진부터 포함됩니다." : null });
  } catch (error) {
    return jsonError(error);
  }
}
