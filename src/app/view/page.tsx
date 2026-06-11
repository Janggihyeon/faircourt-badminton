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
    <main className="min-h-screen bg-[#101820] px-4 py-5 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">FairCourt Badminton</p>
              <h1 className="mt-2 text-4xl font-black">오늘의 경기 현황</h1>
            </div>
            <div className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950">5초 자동 갱신 · {updatedAt || "-"}</div>
          </div>
        </header>
        {error ? <div className="mt-4 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-red-100">{error}</div> : null}

        <section className="mt-6">
          <SectionTitle label="현재 진행 중 경기" count={inProgress.length} />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {inProgress.length ? inProgress.map((match) => <MatchCard key={match.id} match={match} badge="진행 중" active />) : <Empty text="진행 중인 경기가 없습니다." />}
          </div>
        </section>

        <section className="mt-8">
          <SectionTitle label="다음 예정 경기" count={queue.length} />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {queue.length ? queue.map((match) => <MatchCard key={match.id} match={match} badge={`${match.operation_order ?? "-"}번 대기`} />) : <Empty text="운영 대기열이 비어 있습니다." />}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <h2 className="text-2xl font-black">{label}</h2>
      <span className="rounded-full border border-white/10 px-3 py-1 text-sm font-bold text-slate-200">{count}개</span>
    </div>
  );
}

function MatchCard({ match, badge, active = false }: { match: PublicMatch; badge: string; active?: boolean }) {
  return (
    <article className={`rounded-lg border p-5 shadow-lg ${active ? "border-emerald-300/40 bg-emerald-300/10 shadow-emerald-950/20" : "border-white/10 bg-white/[0.07] shadow-black/20"}`}>
      <p className={active ? "text-sm font-black text-emerald-200" : "text-sm font-black text-slate-300"}>{badge}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {match.players.map((player) => (
          <div key={player.id} className="rounded-md bg-white px-4 py-4 text-center text-xl font-black text-slate-950 shadow-sm">
            {player.name}
          </div>
        ))}
      </div>
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-slate-300">{text}</div>;
}
