import { describe, expect, it } from "vitest";
import { isReminderEligible, reminderCopy } from "./reminders";

describe("reminder eligibility", () => {
  const now = new Date("2026-08-22T08:00:00.000Z");

  it("flags a dose inside the configured lead window", () => {
    expect(isReminderEligible({ kind: "dose", scheduledFor: new Date("2026-08-22T08:20:00.000Z"), leadMinutes: 30, now })).toBe(true);
    expect(isReminderEligible({ kind: "dose", scheduledFor: new Date("2026-08-22T09:00:00.000Z"), leadMinutes: 30, now })).toBe(false);
  });

  it("flags a refill date within seven days", () => {
    expect(isReminderEligible({ kind: "refill", refillDate: new Date("2026-08-27T08:00:00.000Z"), now })).toBe(true);
    expect(isReminderEligible({ kind: "refill", refillDate: new Date("2026-09-01T08:00:00.000Z"), now })).toBe(false);
  });

  it("creates concise, non-clinical reminder copy", () => {
    expect(reminderCopy("dose", "Lisinopril")).toContain("scheduled dose");
    expect(reminderCopy("refill", "Vitamin D3")).toContain("refill date");
  });
});
