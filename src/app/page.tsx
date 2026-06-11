import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-emerald-700">FairCourt Badminton</p>
        <h1 className="mt-2 text-4xl font-bold">공정한 복식 대진 운영</h1>
        <p className="mt-4 text-slate-600">
          클럽 운영자는 관리자 화면에서 참가자와 대진을 관리하고, 회원은 공개 화면에서 현재 경기와 다음 대기열만 확인합니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white" href="/admin">
            관리자 운영 화면
          </Link>
          <Link className="rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900" href="/view">
            회원 보기 화면
          </Link>
        </div>
      </section>
    </main>
  );
}
