import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-session";
import { appendToQueue, fetchState } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";
import { moveTopSchema } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const { count } = moveTopSchema.parse(await request.json());
    const state = await fetchState();
    const targets = state.matches
      .filter((match) => match.status === "generated")
      .sort((a, b) => (a.generated_order ?? 0) - (b.generated_order ?? 0))
      .slice(0, count);
    for (const match of targets) await appendToQueue(match.id);
    return jsonOk({ moved: targets.length });
  } catch (error) {
    return jsonError(error);
  }
}
