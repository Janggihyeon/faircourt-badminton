import { requireAdmin } from "@/lib/auth/admin-session";
import { fetchState } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  try {
    return jsonOk(await fetchState());
  } catch (error) {
    return jsonError(error, 500);
  }
}
