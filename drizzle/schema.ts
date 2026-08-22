import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const medicines = mysqlTable("medicines", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  dose: varchar("dose", { length: 120 }).notNull(),
  form: varchar("form", { length: 80 }).notNull(),
  instructions: text("instructions").notNull(),
  scheduleLabel: varchar("scheduleLabel", { length: 120 }).notNull(),
  scheduleTimes: text("scheduleTimes").notNull(),
  refillDate: timestamp("refillDate"),
  remainingDoses: int("remainingDoses").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const doseEvents = mysqlTable("dose_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  medicineId: int("medicineId").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["due", "taken", "missed", "upcoming"]).default("upcoming").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const favoritePharmacies = mysqlTable("favorite_pharmacies", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  externalId: varchar("externalId", { length: 160 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  address: varchar("address", { length: 240 }).notNull(),
  latitude: varchar("latitude", { length: 32 }).notNull(),
  longitude: varchar("longitude", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reminderConfigs = mysqlTable("reminder_configs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  medicineId: int("medicineId"),
  kind: mysqlEnum("kind", ["dose", "refill"]).notNull(),
  leadMinutes: int("leadMinutes").default(30).notNull(),
  emailEnabled: int("emailEnabled").default(0).notNull(),
  scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = typeof medicines.$inferInsert;
export type DoseEvent = typeof doseEvents.$inferSelect;
export type InsertDoseEvent = typeof doseEvents.$inferInsert;
export type ReminderConfig = typeof reminderConfigs.$inferSelect;
export type InsertReminderConfig = typeof reminderConfigs.$inferInsert;
export type FavoritePharmacy = typeof favoritePharmacies.$inferSelect;
export type InsertFavoritePharmacy = typeof favoritePharmacies.$inferInsert;
