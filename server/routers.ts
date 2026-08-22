import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createMedicineForOwner, createReminderConfigForOwner, listMedicinesForOwner, listReminderConfigsForOwner, setReminderTaskUid, updateDoseEventStatus, updateMedicineForOwner, updateReminderConfigForOwner } from "./db";
import { getIntegrationStatus } from "./integrations";

const medicineInput = z.object({ name: z.string().min(1).max(160), dose: z.string().min(1).max(120), form: z.string().default("Tablet"), instructions: z.string().min(1), scheduleLabel: z.string().min(1), scheduleTimes: z.string().min(1), refillDate: z.date().nullable().optional(), remainingDoses: z.number().int().nonnegative().default(0), notes: z.string().nullable().optional() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  medicines: router({
    list: protectedProcedure.query(({ ctx }) => listMedicinesForOwner(ctx.user.id)),
    create: protectedProcedure.input(medicineInput).mutation(({ ctx, input }) => createMedicineForOwner(ctx.user.id, input)),
    update: protectedProcedure.input(z.object({ id: z.number().int(), patch: medicineInput.partial() })).mutation(({ ctx, input }) => updateMedicineForOwner(ctx.user.id, input.id, input.patch)),
  }),
  doseEvents: router({
    mark: protectedProcedure.input(z.object({ id: z.number().int(), status: z.enum(["due", "taken", "missed", "upcoming"]) })).mutation(({ ctx, input }) => updateDoseEventStatus(ctx.user.id, input.id, input.status)),
  }),
  reminders: router({
    list: protectedProcedure.query(({ ctx }) => listReminderConfigsForOwner(ctx.user.id)),
    providerStatus: protectedProcedure.query(() => getIntegrationStatus()),
    schedule: protectedProcedure.input(z.object({ kind: z.enum(["dose", "refill"]), cron: z.string().regex(/^\d+ \d+ \d+ \S+ \S+ \S+$/), medicineId: z.number().int().nullable().optional(), leadMinutes: z.number().int().min(1).max(1440).default(30) })).mutation(async ({ ctx, input }) => { const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; const job = await createHeartbeatJob({ name: `medgrid-${ctx.user.id}-${input.kind}-${Date.now()}`, cron: input.cron, path: "/api/scheduled/reminders", description: `MedGrid ${input.kind} reminder`, payload: { ownerId: ctx.user.id, kind: input.kind } }, sessionToken); await createReminderConfigForOwner(ctx.user.id, { kind: input.kind, medicineId: input.medicineId ?? null, leadMinutes: input.leadMinutes, emailEnabled: 0, scheduleCronTaskUid: job.taskUid }); return job; }),
    update: protectedProcedure.input(z.object({ reminderId: z.number().int(), taskUid: z.string(), cron: z.string().regex(/^\d+ \d+ \d+ \S+ \S+ \S+$/).optional(), enabled: z.boolean().optional() })).mutation(async ({ ctx, input }) => { const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? ""; const result = await updateHeartbeatJob(input.taskUid, { cron: input.cron, enable: input.enabled }, sessionToken); await updateReminderConfigForOwner(ctx.user.id, input.reminderId, { scheduleCronTaskUid: input.taskUid }); return result; }),
    attachTask: protectedProcedure.input(z.object({ reminderId: z.number().int(), taskUid: z.string().nullable() })).mutation(({ ctx, input }) => setReminderTaskUid(ctx.user.id, input.reminderId, input.taskUid)),
  }),
});

export type AppRouter = typeof appRouter;
