export type Gender = "M" | "F";
export type PlayerStatus =
  | "not_arrived"
  | "active"
  | "playing"
  | "left"
  | "inactive";
export type MatchStatus =
  | "generated"
  | "operation_queue"
  | "in_progress"
  | "completed"
  | "cancelled";
export type MatchSource = "auto" | "manual";
export type MatchType = "men" | "women" | "mixed" | "manual";
export type SkillGapMode = "strict" | "normal" | "loose" | "none";

export type AppSettings = {
  id: number;
  meeting_started: boolean;
  court_warning_limit: number;
  skill_gap_mode: SkillGapMode;
  auto_generation_default_count: number;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  name: string;
  gender: Gender;
  skill: number;
  status: PlayerStatus;
  games_played: number;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  source: MatchSource;
  status: MatchStatus;
  match_type: MatchType;
  player_ids: string[];
  generated_order: number | null;
  operation_order: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MatchWithPlayers = Match & {
  players: Player[];
};

export type NewAutoMatch = {
  player_ids: string[];
  match_type: Exclude<MatchType, "manual">;
  warning?: string;
  score: number;
};
