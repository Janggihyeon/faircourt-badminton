import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AppSettings, Match, MatchStatus, MatchWithPlayers, Player, PlayerStatus } from "@/lib/matchmaking/types";

const DEFAULT_SETTINGS = {
  id: 1,
  meeting_started: false,
  court_warning_limit: 2,
  skill_gap_mode: "normal",
  auto_generation_default_count: 2,
};

export const ok = <T>(data: T) => ({ data, error: null });

export const ensureSettings = async () => {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  if (data) return data as AppSettings;
  const { data: inserted, error } = await supabase.from("app_settings").insert(DEFAULT_SETTINGS).select("*").single();
  if (error) throw error;
  return inserted as AppSettings;
};

export const fetchState = async () => {
  const supabase = getSupabaseAdmin();
  const settings = await ensureSettings();
  const [{ data: players, error: playersError }, { data: matches, error: matchesError }] = await Promise.all([
    supabase.from("players").select("*").order("created_at", { ascending: true }),
    supabase.from("matches").select("*").order("created_at", { ascending: true }),
  ]);
  if (playersError) throw playersError;
  if (matchesError) throw matchesError;
  return {
    settings,
    players: (players ?? []) as Player[],
    matches: hydrateMatches((matches ?? []) as Match[], (players ?? []) as Player[]),
  };
};

export const hydrateMatches = (matches: Match[], players: Player[]): MatchWithPlayers[] => {
  const playerMap = new Map(players.map((player) => [player.id, player]));
  return matches.map((match) => ({
    ...match,
    players: match.player_ids.map((id) => playerMap.get(id)).filter(Boolean) as Player[],
  }));
};

export const nextGeneratedOrder = async () => {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("matches")
    .select("generated_order")
    .eq("status", "generated")
    .order("generated_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.generated_order ?? 0) + 1;
};

export const appendToQueue = async (matchId: string) => {
  const supabase = getSupabaseAdmin();
  const nextOrder = await nextQueueOrder();
  const { error } = await supabase
    .from("matches")
    .update({
      status: "operation_queue",
      operation_order: nextOrder,
      generated_order: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId);
  if (error) throw error;
  await reorderQueue();
};

export const nextQueueOrder = async () => {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("matches")
    .select("operation_order")
    .eq("status", "operation_queue")
    .order("operation_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.operation_order ?? 0) + 1;
};

export const reorderQueue = async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("status", "operation_queue")
    .order("operation_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  for (let index = 0; index < (data ?? []).length; index += 1) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({ operation_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", data![index].id);
    if (updateError) throw updateError;
  }
};

export const updatePlayersStatus = async (playerIds: string[], status: PlayerStatus) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("players").update({ status, updated_at: new Date().toISOString() }).in("id", playerIds);
  if (error) throw error;
};

export const getMatch = async (id: string) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("matches").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Match;
};

export const getPlayersByIds = async (ids: string[]) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("players").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Player[];
};

export const statusOrder = (status: MatchStatus) =>
  ({
    in_progress: 0,
    operation_queue: 1,
    generated: 2,
    completed: 3,
    cancelled: 4,
  })[status];
