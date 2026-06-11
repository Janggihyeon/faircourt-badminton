import { z } from "zod";
import { normalizeGender } from "@/lib/format";

export const playerSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요."),
  gender: z.enum(["M", "F"]),
  skill: z.coerce.number().int().min(1).max(5),
  status: z.enum(["not_arrived", "active", "playing", "left", "inactive"]).optional(),
});

export const settingsSchema = z.object({
  court_warning_limit: z.coerce.number().int().min(1).optional(),
  skill_gap_mode: z.enum(["strict", "normal", "loose", "none"]).optional(),
  auto_generation_default_count: z.coerce.number().int().min(1).max(5).optional(),
});

export const parseBulkPlayers = (text: string) => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return rows.map((line, index) => {
    const [rawName, rawGender, rawSkill] = line.split(",").map((item) => item?.trim());
    const gender = normalizeGender(rawGender ?? "");
    const skill = Number(rawSkill);
    if (!rawName || !gender || !Number.isInteger(skill) || skill < 1 || skill > 5) {
      throw new Error(`${index + 1}번째 줄 형식이 올바르지 않습니다: ${line}`);
    }
    return { name: rawName, gender, skill };
  });
};

export const matchPlayerIdsSchema = z.object({
  player_ids: z.array(z.string().uuid()).length(4),
});

export const generateSchema = z.object({
  count: z.coerce.number().int().min(1).max(5),
  force: z.boolean().optional().default(false),
});

export const moveTopSchema = z.object({
  count: z.coerce.number().int().min(1).max(20),
});
