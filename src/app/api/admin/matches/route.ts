import { requireAdmin } from "@/lib/auth/admin-session";
import { fetchState } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    const state = await fetchState();
    return jsonOk({ matches: state.matches });
  } catch (error) {
    return jsonError(error, 500);
  }
}
