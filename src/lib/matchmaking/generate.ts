import type { Match, NewAutoMatch, Player, SkillGapMode } from "@/lib/matchmaking/types";
import { inferMatchType, scoreCandidate } from "@/lib/matchmaking/scoring";

const combinations = <T>(items: T[], size: number): T[][] => {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...tail] = items;
  return [
    ...combinations(tail, size - 1).map((combo) => [head, ...combo]),
    ...combinations(tail, size),
  ];
};

export const shouldWarnBeforeGenerate = (activePlayers: Player[], count: number) => {
  const men = activePlayers.filter((player) => player.gender === "M").length;
  const women = activePlayers.length - men;
  const hasValidComposition = men >= 4 || women >= 4 || (men >= 2 && women >= 2);
  if (!hasValidComposition) return "자동 대진에 필요한 성별 구성이 부족합니다.";
  if (activePlayers.length < count * 4) {
    return "현재 참여 인원으로는 선택한 개수의 대진을 모든 조건을 만족하면서 생성하기 어렵습니다. 연속 출전 또는 반복 조합이 발생할 수 있습니다.";
  }
  return null;
};

export const generateAutoMatches = ({
  players,
  contextMatches,
  completedMatches,
  count,
  skillGapMode,
}: {
  players: Player[];
  contextMatches: Match[];
  completedMatches: Match[];
  count: number;
  skillGapMode: SkillGapMode;
}) => {
  const activePlayers = players.filter((player) => player.status === "active");
  const activeGenderRatio = {
    men: activePlayers.filter((player) => player.gender === "M").length,
    women: activePlayers.filter((player) => player.gender === "F").length,
  };
  const selected: NewAutoMatch[] = [];
  const temporaryContext = [...contextMatches];

  for (let index = 0; index < count; index += 1) {
    const candidates = combinations(activePlayers, 4)
      .map((candidate) => ({ candidate, type: inferMatchType(candidate) }))
      .filter((item): item is { candidate: Player[]; type: "men" | "women" | "mixed" } => item.type !== null)
      .map(({ candidate, type }) => {
        const result = scoreCandidate({
          candidate,
          contextMatches: temporaryContext,
          completedMatches,
          skillGapMode,
          activeGenderRatio,
        });
        return {
          player_ids: candidate.map((player) => player.id),
          match_type: type,
          warning: result.warnings[0],
          score: result.score,
        };
      })
      .sort((a, b) => a.score - b.score || a.player_ids.join("").localeCompare(b.player_ids.join("")));

    const best = candidates[0];
    if (!best) break;
    selected.push(best);
    temporaryContext.unshift({
      id: `temporary-${index}`,
      source: "auto",
      status: "generated",
      match_type: best.match_type,
      player_ids: best.player_ids,
      generated_order: index,
      operation_order: null,
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return selected;
};
