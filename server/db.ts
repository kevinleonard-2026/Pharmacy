import { and, eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { DoseEvent, InsertMedicine, InsertReminderConfig, InsertUser, doseEvents, medicines, reminderConfigs, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


export async function listMedicinesForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(medicines).where(eq(medicines.ownerId, ownerId)).orderBy(desc(medicines.updatedAt));
}

export async function createMedicineForOwner(ownerId: number, input: Omit<InsertMedicine, "ownerId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(medicines).values({ ...input, ownerId });
  return result;
}

export async function updateDoseEventStatus(ownerId: number, doseEventId: number, status: DoseEvent["status"]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.update(doseEvents).set({ status, completedAt: status === "taken" ? new Date() : null }).where(and(eq(doseEvents.id, doseEventId), eq(doseEvents.ownerId, ownerId)));
}

export async function listReminderConfigsForOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminderConfigs).where(eq(reminderConfigs.ownerId, ownerId));
}


export async function createReminderConfigForOwner(ownerId: number, input: Omit<InsertReminderConfig, "ownerId">) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.insert(reminderConfigs).values({ ...input, ownerId });
}

export async function setReminderTaskUid(ownerId: number, reminderId: number, taskUid: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.update(reminderConfigs).set({ scheduleCronTaskUid: taskUid }).where(and(eq(reminderConfigs.id, reminderId), eq(reminderConfigs.ownerId, ownerId)));
}


export async function updateMedicineForOwner(ownerId: number, medicineId: number, input: Partial<Omit<InsertMedicine, "ownerId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.update(medicines).set(input).where(and(eq(medicines.id, medicineId), eq(medicines.ownerId, ownerId)));
}


export async function updateReminderConfigForOwner(ownerId: number, reminderId: number, input: { scheduleCronTaskUid?: string | null; emailEnabled?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.update(reminderConfigs).set(input).where(and(eq(reminderConfigs.id, reminderId), eq(reminderConfigs.ownerId, ownerId)));
}
