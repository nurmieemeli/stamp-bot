import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { moderationCases, type ModerationCase } from "../schema";

export type ModerationCaseType = "warn" | "timeout" | "kick" | "ban" | "unban";

export async function createCase(data: {
  guildId: string;
  type: ModerationCaseType;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  reason?: string | null;
  durationMs?: number | null;
}): Promise<ModerationCase> {
  const result = await db
    .insert(moderationCases)
    .values({
      guildId: data.guildId,
      type: data.type,
      targetId: data.targetId,
      targetTag: data.targetTag,
      moderatorId: data.moderatorId,
      reason: data.reason ?? null,
      durationMs: data.durationMs ?? null,
      createdAt: Date.now(),
    })
    .returning()
    .get();

  return result;
}

export async function getCasesForUser(
  guildId: string,
  targetId: string,
  limit = 25
): Promise<ModerationCase[]> {
  return db
    .select()
    .from(moderationCases)
    .where(and(eq(moderationCases.guildId, guildId), eq(moderationCases.targetId, targetId)))
    .orderBy(desc(moderationCases.id))
    .limit(limit)
    .all();
}
