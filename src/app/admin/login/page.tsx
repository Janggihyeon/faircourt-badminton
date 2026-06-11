"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "로그인에 실패했습니다.");
      return;
    }
    router.push("/admin");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">FairCourt Badminton</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">관리자 로그인</h1>
        <label className="mt-6 block text-sm font-semibold text-slate-700">
          관리자 비밀번호
          <input
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-emerald-600"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "확인 중" : "로그인"}
        </button>
      </form>
    </main>
  );
}
