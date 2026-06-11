"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings, MatchStatus, MatchWithPlayers, Player } from "@/lib/matchmaking/types";
import { formatDateTime, genderLabel, matchStatusLabel, matchTypeLabel, statusLabel } from "@/lib/format";

type State = {
  settings: AppSettings;
  players: Player[];
  matches: MatchWithPlayers[];
};

const emptyPlayer = { name: "", gender: "M", skill: 3, status: "not_arrived" };
const sectionClass = "rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm shadow-slate-900/5";
const inputClass = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const buttonClass = "rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 disabled:opacity-50";
const ghostButtonClass = "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50";
const playerStatusStyle = {
  not_arrived: { row: "bg-slate-50", badge: "bg-slate-200 text-slate-700" },
  active: { row: "bg-emerald-50", badge: "bg-emerald-200 text-emerald-900" },
  playing: { row: "bg-sky-50", badge: "bg-sky-200 text-sky-900" },
  left: { row: "bg-amber-50", badge: "bg-amber-200 text-amber-900" },
  inactive: { row: "bg-rose-50", badge: "bg-rose-200 text-rose-900" },
} satisfies Record<Player["status"], { row: string; badge: string }>;

export default function AdminPage() {
  const router = useRouter();
  const [state, setState] = useState<State | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [playerForm, setPlayerForm] = useState(emptyPlayer);
  const [bulkText, setBulkText] = useState("");
  const [generateCount, setGenerateCount] = useState(2);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [aiText, setAiText] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/state");
    if (response.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "상태를 불러오지 못했습니다.");
      return;
    }
    setState(data);
    setGenerateCount(data.settings.auto_generation_default_count);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const request = async (url: string, options: RequestInit = {}, success = "처리되었습니다.") => {
    setError("");
    setMessage("");
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "요청을 처리하지 못했습니다.");
      return null;
    }
    setMessage(data.warning ?? success);
    await load();
    return data;
  };

  const addPlayer = async (event: FormEvent) => {
    event.preventDefault();
    if (state?.settings.meeting_started) {
      const confirmed = confirm(
        "모임이 이미 시작된 상태입니다. 새로 추가된 참가자는 이미 생성된 예정 대진에는 자동 반영되지 않으며, 이후 새로 생성되는 대진부터 포함됩니다.",
      );
      if (!confirmed) return;
    }
    await request("/api/admin/players", { method: "POST", body: JSON.stringify(playerForm) }, "참가자를 추가했습니다.");
    setPlayerForm(emptyPlayer);
  };

  const generated = useMemo(() => state?.matches.filter((match) => match.status === "generated") ?? [], [state]);
  const queue = useMemo(
    () => (state?.matches.filter((match) => match.status === "operation_queue") ?? []).sort((a, b) => (a.operation_order ?? 0) - (b.operation_order ?? 0)),
    [state],
  );
  const inProgress = useMemo(() => state?.matches.filter((match) => match.status === "in_progress") ?? [], [state]);
  const activePlayers = useMemo(() => state?.players.filter((player) => player.status === "active" || player.status === "playing").length ?? 0, [state]);
  const completedCount = useMemo(() => state?.matches.filter((match) => match.status === "completed").length ?? 0, [state]);

  if (!state) {
    return <main className="min-h-screen bg-slate-100 p-6 text-slate-950">불러오는 중...</main>;
  }

  const updateSettings = (patch: Partial<AppSettings>) =>
    request("/api/admin/settings", { method: "PATCH", body: JSON.stringify(patch) }, "설정을 저장했습니다.");

  const selectedPayload = () => {
    if (selectedPlayers.length !== 4) {
      setError("참가자 4명을 선택해주세요.");
      return null;
    }
    return { player_ids: selectedPlayers };
  };

  const renderMatch = (match: MatchWithPlayers, controls: "generated" | "queue" | "progress" | "record") => (
    <div key={match.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-950">
            {match.operation_order ? `${match.operation_order}. ` : ""}
            {match.players.map((player) => player.name).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {matchTypeLabel(match.match_type)} · {match.source === "auto" ? "자동" : "수동"} · {matchStatusLabel(match.status)}
          </p>
        </div>
        {controls !== "record" ? (
          <div className="flex flex-wrap gap-2">
            {controls === "generated" ? (
              <button className={ghostButtonClass} onClick={() => request(`/api/admin/matches/${match.id}/move-to-queue`, { method: "POST" }, "대기열로 이동했습니다.")}>
                대기열로
              </button>
            ) : null}
            {controls === "queue" ? (
              <button
                className={buttonClass}
                onClick={() => {
                  if (match.operation_order !== 1 && !confirm("이 대진은 대기열의 첫 번째 대진이 아닙니다. 순서를 건너뛰고 이 경기를 시작하시겠습니까?")) return;
                  if (inProgress.length >= state.settings.court_warning_limit && !confirm("현재 진행 중인 경기가 설정된 코트 기준에 도달했습니다. 실제 사용 가능한 코트를 확인한 뒤 진행해주세요. 그래도 이 경기를 시작하시겠습니까?")) return;
                  void request(`/api/admin/matches/${match.id}/start`, { method: "POST" }, "경기를 시작했습니다.");
                }}
              >
                시작
              </button>
            ) : null}
            {controls === "progress" ? (
              <button className={buttonClass} onClick={() => request(`/api/admin/matches/${match.id}/complete`, { method: "POST" }, "경기를 완료했습니다.")}>
                완료
              </button>
            ) : null}
            {controls !== "progress" ? (
              <button
                className={ghostButtonClass}
                onClick={() => {
                  const payload = selectedPayload();
                  if (payload) void request(`/api/admin/matches/${match.id}`, { method: "PATCH", body: JSON.stringify(payload) }, "선택한 4명으로 수정했습니다.");
                }}
              >
                선택 4명으로 수정
              </button>
            ) : null}
            {controls !== "progress" ? (
              <button className={ghostButtonClass} onClick={() => request(`/api/admin/matches/${match.id}/cancel`, { method: "POST" }, "대진을 취소했습니다.")}>
                취소
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f5f7f2] p-4 text-slate-950 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Shuttle Bus</p>
            <h1 className="text-3xl font-black">관리자 운영 화면</h1>
          </div>
          <div className="flex gap-2">
            <a className={ghostButtonClass} href="/view" target="_blank">
              회원 화면
            </a>
            <button className={ghostButtonClass} onClick={() => request("/api/admin/logout", { method: "POST" }, "로그아웃했습니다.").then(() => router.push("/admin/login"))}>
              로그아웃
            </button>
          </div>
                  </div>
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="참여 인원" value={activePlayers + "명"} />
          <StatCard label="생성 대진" value={generated.length + "개"} />
          <StatCard label="대기열" value={queue.length + "개"} />
          <StatCard label="완료 경기" value={completedCount + "개"} />
        </div>

        {message ? <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <section className={sectionClass}>
          <h2 className="text-lg font-bold">운영 설정</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-5">
            <button className={buttonClass} onClick={() => request("/api/admin/start-meeting", { method: "POST" }, "모임을 시작했습니다.")} disabled={state.settings.meeting_started}>
              {state.settings.meeting_started ? "모임 진행 중" : "모임 시작"}
            </button>
            <label className="text-sm font-semibold">
              코트 경고 기준
              <input className={`${inputClass} mt-1 w-full`} type="number" min={1} value={state.settings.court_warning_limit} onChange={(event) => updateSettings({ court_warning_limit: Number(event.target.value) })} />
            </label>
            <label className="text-sm font-semibold">
              실력 차이 기준
              <select className={`${inputClass} mt-1 w-full`} value={state.settings.skill_gap_mode} onChange={(event) => updateSettings({ skill_gap_mode: event.target.value as AppSettings["skill_gap_mode"] })}>
                <option value="strict">엄격</option>
                <option value="normal">보통</option>
                <option value="loose">느슨</option>
                <option value="none">무시</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              자동 생성 기본 개수
              <select className={`${inputClass} mt-1 w-full`} value={state.settings.auto_generation_default_count} onChange={(event) => updateSettings({ auto_generation_default_count: Number(event.target.value) })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2">
              <button
                className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800"
                onClick={() => {
                  if (confirm("참가자는 유지하고 대진표와 경기 기록만 초기화할까요? 참가자는 모두 참여 중 상태로 돌아갑니다.")) {
                    void request("/api/admin/reset", { method: "POST", body: JSON.stringify({ keepPlayers: true }) }, "참가자를 유지하고 대진표를 초기화했습니다.");
                  }
                }}
              >
                대진만 초기화
              </button>
              <button
                className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-700"
                onClick={() => {
                  if (confirm("정말 오늘의 참가자와 대진표를 모두 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    void request("/api/admin/reset", { method: "POST", body: JSON.stringify({ keepPlayers: false }) }, "전체 초기화했습니다.");
                  }
                }}
              >
                전체 초기화
              </button>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-bold">참가자 관리</h2>
          <form onSubmit={addPlayer} className="mt-3 grid gap-2 md:grid-cols-5">
            <input className={inputClass} placeholder="이름" value={playerForm.name} onChange={(event) => setPlayerForm({ ...playerForm, name: event.target.value })} />
            <select className={inputClass} value={playerForm.gender} onChange={(event) => setPlayerForm({ ...playerForm, gender: event.target.value })}>
              <option value="M">남</option>
              <option value="F">여</option>
            </select>
            <select className={inputClass} value={playerForm.skill} onChange={(event) => setPlayerForm({ ...playerForm, skill: Number(event.target.value) })}>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  실력 {value}
                </option>
              ))}
            </select>
            {state.settings.meeting_started ? (
              <select className={inputClass} value={playerForm.status} onChange={(event) => setPlayerForm({ ...playerForm, status: event.target.value })}>
                <option value="not_arrived">미도착으로 추가</option>
                <option value="active">바로 참여 중으로 추가</option>
              </select>
            ) : null}
            <button className={buttonClass}>추가</button>
          </form>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
            <textarea className={`${inputClass} min-h-28`} placeholder={"김민수, 남, 4\n이지은, 여, 3"} value={bulkText} onChange={(event) => setBulkText(event.target.value)} />
            <button className={buttonClass} onClick={() => request("/api/admin/players/bulk", { method: "POST", body: JSON.stringify({ text: bulkText }) }, "일괄 추가했습니다.").then(() => setBulkText(""))}>
              일괄 추가
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-2">선택</th>
                  <th>이름</th>
                  <th>성별</th>
                  <th>실력</th>
                  <th>상태</th>
                  <th>경기 수</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {state.players.map((player) => (
                  <tr key={player.id} className={`border-b border-white ${playerStatusStyle[player.status].row}`}>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={(event) =>
                          setSelectedPlayers((current) => (event.target.checked ? [...current, player.id].slice(-4) : current.filter((id) => id !== player.id)))
                        }
                      />
                    </td>
                    <td className="font-semibold">{player.name}</td>
                    <td>{genderLabel(player.gender)}</td>
                    <td>{player.skill}</td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${playerStatusStyle[player.status].badge}`}>
                        {statusLabel(player.status)}
                      </span>
                    </td>
                    <td>{player.games_played}</td>
                    <td className="flex flex-wrap gap-1 py-2">
                      <button className={ghostButtonClass} onClick={() => request(`/api/admin/players/${player.id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) }, "참여 처리했습니다.")}>
                        출석/참여
                      </button>
                      <button className={ghostButtonClass} onClick={() => request(`/api/admin/players/${player.id}`, { method: "PATCH", body: JSON.stringify({ status: "left" }) }, "귀가 처리했습니다.")}>
                        귀가 처리
                      </button>
                      <button className={ghostButtonClass} onClick={() => request(`/api/admin/players/${player.id}`, { method: "PATCH", body: JSON.stringify({ status: "inactive" }) }, "비활성화했습니다.")}>
                        비활성화
                      </button>
                      {!state.settings.meeting_started ? (
                        <button className={ghostButtonClass} onClick={() => request(`/api/admin/players/${player.id}`, { method: "DELETE" }, "삭제했습니다.")}>
                          삭제
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className={sectionClass}>
            <h2 className="text-lg font-bold">자동 대진표 관리</h2>
            <div className="mt-3 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
              <label className="text-sm font-semibold">
                생성 개수
                <select className={` mt-1 w-full`} value={generateCount} onChange={(event) => setGenerateCount(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}개
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={buttonClass}
                onClick={async () => {
                  const data = await request("/api/admin/generate-matches", { method: "POST", body: JSON.stringify({ count: generateCount }) }, "자동 대진을 생성했습니다.");
                  if (data?.needsConfirmation && confirm(`\n\n그래도 생성하시겠습니까?`)) {
                    await request("/api/admin/generate-matches", { method: "POST", body: JSON.stringify({ count: generateCount, force: true }) }, "자동 대진을 생성했습니다.");
                  }
                }}
              >
                대진 생성
              </button>
              <button
                className={ghostButtonClass}
                onClick={() => request("/api/admin/matches/move-top-to-queue", { method: "POST", body: JSON.stringify({ count: state.settings.court_warning_limit }) }, "코트 기준만큼 대기열로 이동했습니다.")}
              >
                코트 기준만큼 대기열로
              </button>
            </div>
            <div className="mt-4 space-y-2">{generated.map((match) => renderMatch(match, "generated"))}</div>
          </section>

          <section className={sectionClass}>
            <h2 className="text-lg font-bold">경기 운영 대기열</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className={ghostButtonClass}
                onClick={() => {
                  const payload = selectedPayload();
                  if (payload) void request("/api/admin/matches/manual", { method: "POST", body: JSON.stringify({ ...payload, status: "operation_queue" }) }, "수동 대진을 대기열에 추가했습니다.");
                }}
              >
                선택 4명 수동 대진 추가
              </button>
            </div>
            <div className="mt-4 space-y-2">{queue.map((match) => renderMatch(match, "queue"))}</div>
          </section>
        </div>

        <section className={sectionClass}>
          <h2 className="text-lg font-bold">진행 중 경기</h2>
          <div className="mt-4 space-y-2">{inProgress.map((match) => renderMatch(match, "progress"))}</div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-bold">AI 공정성 분석</h2>
          <button
            className={`${buttonClass} mt-3`}
            onClick={async () => {
              const data = await request("/api/admin/ai-analysis", { method: "POST" }, "분석을 완료했습니다.");
              if (data?.analysis) setAiText(data.analysis);
            }}
          >
            분석 실행
          </button>
          {aiText ? <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-900 p-4 text-sm text-white">{aiText}</pre> : null}
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-bold">기록 탭</h2>
          {(["generated", "operation_queue", "in_progress", "completed", "cancelled"] as MatchStatus[]).map((status) => (
            <div key={status} className="mt-4">
              <h3 className="font-semibold">{matchStatusLabel(status)}</h3>
              <div className="mt-2 space-y-2">
                {state.matches
                  .filter((match) => match.status === status)
                  .map((match) => (
                    <div key={match.id} className="rounded-md border border-slate-200 p-3 text-sm">
                      <p className="font-semibold">{match.players.map((player) => player.name).join(" · ")}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {match.source === "auto" ? "자동" : "수동"} · 생성 {formatDateTime(match.created_at)} · 시작 {formatDateTime(match.started_at)} · 완료 {formatDateTime(match.completed_at)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
