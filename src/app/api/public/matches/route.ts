import { fetchState } from "@/lib/server/data";
import { jsonError, jsonOk } from "@/lib/server/responses";

export async function GET() {
  try {
    const state = await fetchState();
    const visible = state.matches
      .filter((match) => ["in_progress", "operation_queue"].includes(match.status))
      .sort((a, b) => (a.operation_order ?? 0) - (b.operation_order ?? 0))
      .map((match) => ({
        id: match.id,
        status: match.status,
        operation_order: match.operation_order,
        players: match.players.map((player) => ({ id: player.id, name: player.name })),
      }));
    return jsonOk({ matches: visible });
  } catch (error) {
    return jsonError(error, 500);
  }
}
