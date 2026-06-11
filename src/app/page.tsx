import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl content-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">FairCourt Badminton</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-tight text-slate-950 md:text-7xl">
            공정한 복식 대진을 빠르게 운영하세요
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            참가자 출석, 자동 대진 생성, 운영 대기열, 진행 중 경기와 완료 기록까지 한 화면에서 관리하는 배드민턴 클럽용 MVP입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-md bg-emerald-700 px-5 py-3 font-bold text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800" href="/admin">
              관리자 운영 화면
            </Link>
            <Link className="rounded-md border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 shadow-sm hover:border-emerald-600" href="/view">
              회원 보기 화면
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
          <div className="rounded-md bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-300">오늘의 운영판</p>
                <p className="mt-1 text-xl font-bold">동호회 수요 경기</p>
              </div>
              <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">LIVE</span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                ["1코트 진행 중", "김민수 · 최서연 · 박준호 · 한지민"],
                ["2번 대기", "이도윤 · 김하늘 · 강민재 · 박소연"],
                ["3번 대기", "정우성 · 정유나 · 최현우 · 오민지"],
              ].map(([label, names]) => (
                <div key={label} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-semibold text-emerald-200">{label}</p>
                  <p className="mt-2 text-lg font-bold">{names}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
