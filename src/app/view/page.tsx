"use client";

import { useCallback, useEffect, useState } from "react";

type PublicMatch = {
  id: string;
  status: "in_progress" | "operation_queue";
  operation_order: number | null;
  players: { id: string; name: string }[];
};

export default function PublicViewPage() {
  const [matches, setMatches] = useState<PublicMatch[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/public/matches", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "대진을 불러오지 못했습니다.");
      return;
    }
    setMatches(data.matches ?? []);
    setUpdatedAt(new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void load();
    }, 0);
    const timer = window.setInterval(() => {
      void load();
    }, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const inProgress = matches.filter((match) => match.status === "in_progress");
  const queue = matches.filter((match) => match.status === "operation_queue").sort((a, b) => (a.operation_order ?? 0) - (b.operation_order ?? 0));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-300">FairCourt Badminton</p>
            <h1 className="text-3xl font-bold">오늘의 경기 현황</h1>
          </div>
          <p className="text-sm text-slate-300">마지막 갱신 {updatedAt || "-"}</p>
        </header>
        {error ? <div className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-red-100">{error}</div> : null}

        <section className="mt-6">
          <h2 className="text-xl font-bold">현재 진행 중 경기</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {inProgress.length ? inProgress.map((match) => <MatchCard key={match.id} match={match} badge="진행 중" />) : <Empty text="진행 중인 경기가 없습니다." />}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold">다음 예정 경기</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {queue.length ? queue.map((match) => <MatchCard key={match.id} match={match} badge={`${match.operation_order ?? "-"}번 대기`} />) : <Empty text="운영 대기열이 비어 있습니다." />}
          </div>
        </section>
      </div>
    </main>
  );
}

function MatchCard({ match, badge }: { match: PublicMatch; badge: string }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/10 p-5">
      <p className="text-sm font-semibold text-emerald-200">{badge}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {match.players.map((player) => (
          <div key={player.id} className="rounded-md bg-white px-4 py-3 text-center text-lg font-bold text-slate-950">
            {player.name}
          </div>
        ))}
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-slate-300">{text}</div>;
}
