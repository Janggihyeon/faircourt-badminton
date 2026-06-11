import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section
        className="relative flex min-h-screen items-center bg-cover bg-center px-4 py-10"
        style={{ backgroundImage: "url('/shuttle-bus-hero.png')" }}
      >
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="relative mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">Shuttle Bus</p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">
              배드민턴 모임 운영을 더 가볍게
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-100">
              참가자 출석부터 자동 대진 생성, 운영 대기열, 진행 중 경기와 기록 관리까지 한 번에 정리하는 클럽 운영 도구입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-md bg-emerald-400 px-5 py-3 font-black text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-300" href="/admin">
                관리자 운영 화면
              </Link>
              <Link className="rounded-md border border-white/40 bg-white/15 px-5 py-3 font-black text-white backdrop-blur hover:bg-white/25" href="/view">
                회원 보기 화면
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
      </section>
    </main>
  );
}
