export type ReminderCandidate = {
  kind: "dose" | "refill";
  scheduledFor?: Date;
  refillDate?: Date | null;
  leadMinutes?: number;
  now?: Date;
};

export function isReminderEligible(candidate: ReminderCandidate): boolean {
  const now = candidate.now ?? new Date();
  if (candidate.kind === "dose") {
    if (!candidate.scheduledFor) return false;
    const minutesUntil = (candidate.scheduledFor.getTime() - now.getTime()) / 60000;
    const lead = candidate.leadMinutes ?? 30;
    return minutesUntil >= 0 && minutesUntil <= lead;
  }
  if (!candidate.refillDate) return false;
  const daysUntil = (candidate.refillDate.getTime() - now.getTime()) / 86400000;
  return daysUntil >= 0 && daysUntil <= 7;
}

export function reminderCopy(kind: ReminderCandidate["kind"], label: string): string {
  return kind === "dose" ? `${label} is approaching. Review your scheduled dose.` : `${label} is approaching its refill date.`;
}
