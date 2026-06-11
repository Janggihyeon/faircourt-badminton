import { requireAdmin } from "@/lib/auth/admin-session";
import { fetchState } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

const fallbackAnalysis = (state: Awaited<ReturnType<typeof fetchState>>) => {
  const completed = state.matches.filter((match) => match.status === "completed");
  const active = state.players.filter((player) => player.status === "active" || player.status === "playing");
  const gameCounts = active.map((player) => player.games_played);
  const minGames = gameCounts.length ? Math.min(...gameCounts) : 0;
  const maxGames = gameCounts.length ? Math.max(...gameCounts) : 0;
  const generatedCount = state.matches.filter((match) => match.status === "generated").length;
  const queuedCount = state.matches.filter((match) => match.status === "operation_queue").length;
  const inProgressCount = state.matches.filter((match) => match.status === "in_progress").length;

  return [
    "로컬 분석 결과입니다.",
    `현재 참여/경기 중 인원은 ${active.length}명이며 경기 수 편차는 ${minGames}~${maxGames}회입니다.`,
    `생성 대진 ${generatedCount}개, 운영 대기 ${queuedCount}개, 진행 중 ${inProgressCount}개, 완료 기록 ${completed.length}개가 있습니다.`,
    maxGames - minGames <= 1
      ? "게임 수 균형은 양호합니다. 대기 시간이 긴 참가자를 계속 우선 배정하면 좋습니다."
      : "게임 수 차이가 보입니다. 자동 생성 개수를 줄이거나 덜 뛴 참가자를 수동 대진에 포함해 균형을 맞춰보세요.",
    "자동 대진은 같은 4인 조합, 가까운 경기의 연속 출전, 성별 구성, 실력 차이를 점수화해 낮은 점수 조합을 선택합니다.",
  ].join("\n\n");
};

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const state = await fetchState();
    if (!process.env.OPENAI_API_KEY) {
      return jsonOk({ analysis: fallbackAnalysis(state), source: "fallback" });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: "너는 배드민턴 클럽 운영 보조자다. 대진을 만들지 말고 현재 대진의 공정성만 한국어로 간결하게 분석한다.",
          },
          {
            role: "user",
            content: JSON.stringify({
              settings: state.settings,
              players: state.players,
              matches: state.matches,
            }),
          },
        ],
      }),
    });

    if (!response.ok) throw new Error("OpenAI 분석 요청에 실패했습니다.");
    const data = await response.json();
    const text =
      data.output_text ??
      data.output?.flatMap((item: { content?: { text?: string }[] }) => item.content ?? []).map((item: { text?: string }) => item.text).join("\n") ??
      fallbackAnalysis(state);
    return jsonOk({ analysis: text, source: "openai" });
  } catch (error) {
    return jsonError(error, 500);
  }
}
