import type { Match, Player, SkillGapMode } from "@/lib/matchmaking/types";

const sameGroupKey = (ids: string[]) => [...ids].sort().join("|");

export const inferMatchType = (players: Player[]) => {
  const men = players.filter((player) => player.gender === "M").length;
  const women = players.length - men;
  if (men === 4) return "men" as const;
  if (women === 4) return "women" as const;
  if (men === 2 && women === 2) return "mixed" as const;
  return null;
};

export const scoreCandidate = ({
  candidate,
  contextMatches,
  completedMatches,
  skillGapMode,
  activeGenderRatio,
}: {
  candidate: Player[];
  contextMatches: Match[];
  completedMatches: Match[];
  skillGapMode: SkillGapMode;
  activeGenderRatio: { men: number; women: number };
}) => {
  const ids = candidate.map((player) => player.id);
  const key = sameGroupKey(ids);
  let score = 0;
  const warnings: string[] = [];

  const recentCompleted = completedMatches.slice(0, 30);
  recentCompleted.forEach((match, index) => {
    if (sameGroupKey(match.player_ids) === key) {
      score += Math.max(40, 260 - index * 12);
      warnings.push("최근 같은 4인 조합이 있었습니다.");
    }
  });

  contextMatches.forEach((match, index) => {
    const overlap = ids.filter((id) => match.player_ids.includes(id)).length;
    if (sameGroupKey(match.player_ids) === key) score += 500;
    if (index < 2 && overlap > 0) score += overlap * 95;
    else score += overlap * 28;
  });

  const minGames = Math.min(...candidate.map((player) => player.games_played));
  score += candidate.reduce((sum, player) => sum + (player.games_played - minGames) * 18, 0);

  const now = Date.now();
  score += candidate.reduce((sum, player) => {
    if (!player.last_played_at) return sum - 10;
    const minutes = Math.max(0, (now - new Date(player.last_played_at).getTime()) / 60000);
    return sum - Math.min(35, minutes / 4);
  }, 0);

  const matchType = inferMatchType(candidate);
  if (matchType === "mixed") {
    const total = activeGenderRatio.men + activeGenderRatio.women;
    const balanced = total > 0 ? Math.abs(activeGenderRatio.men - activeGenderRatio.women) / total : 0;
    score += balanced * 18;
  }
  if (matchType === "men" && activeGenderRatio.women >= activeGenderRatio.men * 0.75) score += 18;
  if (matchType === "women" && activeGenderRatio.men >= activeGenderRatio.women * 0.75) score += 18;
  if (matchType) {
    score += getPersonalMatchTypePenalty(candidate, matchType, [...contextMatches, ...recentCompleted]);
  }

  const skillPenalty = getSkillPenalty(candidate, skillGapMode);
  score += skillPenalty;
  if (skillPenalty >= 60) warnings.push("실력 차이가 큰 조합입니다.");

  return { score, warnings };
};

const getPersonalMatchTypePenalty = (
  candidate: Player[],
  matchType: "men" | "women" | "mixed",
  matches: Match[],
) => {
  const counts = new Map<string, { sameGender: number; mixed: number }>();

  for (const match of matches) {
    if (!["men", "women", "mixed"].includes(match.match_type)) continue;
    for (const playerId of match.player_ids) {
      const current = counts.get(playerId) ?? { sameGender: 0, mixed: 0 };
      if (match.match_type === "mixed") current.mixed += 1;
      else current.sameGender += 1;
      counts.set(playerId, current);
    }
  }

  return candidate.reduce((penalty, player) => {
    const current = counts.get(player.id) ?? { sameGender: 0, mixed: 0 };
    const targetCount = matchType === "mixed" ? current.mixed : current.sameGender;
    const alternativeCount = matchType === "mixed" ? current.sameGender : current.mixed;
    const imbalance = targetCount - alternativeCount;

    if (imbalance >= 2) return penalty + imbalance * 24;
    if (imbalance === 1) return penalty + 8;
    if (imbalance <= -2) return penalty - 10;
    return penalty;
  }, 0);
};

const getSkillPenalty = (candidate: Player[], mode: SkillGapMode) => {
  if (mode === "none") return 0;
  const maxGap = Math.max(...candidate.map((player) => player.skill)) - Math.min(...candidate.map((player) => player.skill));
  const threshold = mode === "strict" ? 2 : mode === "normal" ? 3 : 4;
  const weight = mode === "strict" ? 85 : mode === "normal" ? 55 : 14;
  let penalty = Math.max(0, maxGap - threshold) * weight;

  const men = candidate.filter((player) => player.gender === "M");
  const women = candidate.filter((player) => player.gender === "F");
  for (const group of [men, women]) {
    if (group.length === 2) {
      const gap = Math.abs(group[0].skill - group[1].skill);
      penalty += Math.max(0, gap - threshold) * weight;
    }
  }

  return penalty;
};
