import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { parseBulkPlayers } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { text } = await request.json();
    const players = parseBulkPlayers(String(text ?? ""));
    const { data, error } = await getSupabaseAdmin().from("players").insert(players).select("*");
    if (error) throw error;
    return jsonOk({ players: data ?? [] });
  } catch (error) {
    return jsonError(error);
  }
}
