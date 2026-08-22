import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { reminderConfigs } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { sendReminderEmail } from "./email";

export async function reminderCallback(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.json({ ok: true, skipped: "database-unavailable" });
    const configs = await db.select().from(reminderConfigs).where(eq(reminderConfigs.scheduleCronTaskUid, user.taskUid));
    if (!configs.length) return res.json({ ok: true, skipped: "orphan" });
    const delivery = user.email ? await Promise.all(configs.filter((config) => config.emailEnabled === 1).map((config) => sendReminderEmail({ to: user.email!, subject: `MedGrid ${config.kind} reminder`, text: `Review your approaching ${config.kind} reminder in MedGrid.`, dedupeKey: `${user.taskUid}-${config.id}-${new Date().toISOString().slice(0, 10)}` }))) : [];
    return res.json({ ok: true, ownerId: configs[0].ownerId, reminderConfigIds: configs.map((config) => config.id), delivery: delivery.length ? delivery : "in-app-ready" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reminder callback error";
    return res.status(500).json({ error: message, timestamp: new Date().toISOString() });
  }
}
