import type { Gender, MatchStatus, MatchType, PlayerStatus, SkillGapMode } from "@/lib/matchmaking/types";

export const genderLabel = (gender: Gender) => (gender === "M" ? "남" : "여");

export const statusLabel = (status: PlayerStatus) =>
  ({
    not_arrived: "미도착",
    active: "참여 중",
    playing: "경기 중",
    left: "귀가",
    inactive: "비활성",
  })[status];

export const matchStatusLabel = (status: MatchStatus) =>
  ({
    generated: "생성됨",
    operation_queue: "운영 대기",
    in_progress: "진행 중",
    completed: "완료",
    cancelled: "취소",
  })[status];

export const matchTypeLabel = (type: MatchType) =>
  ({
    men: "남복 그룹",
    women: "여복 그룹",
    mixed: "혼복 그룹",
    manual: "수동",
  })[type];

export const skillGapModeLabel = (mode: SkillGapMode) =>
  ({
    strict: "엄격",
    normal: "보통",
    loose: "느슨",
    none: "무시",
  })[mode];

export const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const normalizeGender = (value: string): Gender | null => {
  const normalized = value.trim().toLowerCase();
  if (["남", "남자", "m"].includes(normalized)) return "M";
  if (["여", "여자", "f"].includes(normalized)) return "F";
  return null;
};
