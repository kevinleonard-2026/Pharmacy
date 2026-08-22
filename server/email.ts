export type ReminderEmail = { to: string; subject: string; text: string; dedupeKey: string };

export async function sendReminderEmail(message: ReminderEmail): Promise<{ sent: boolean; reason?: string }> {
  const endpoint = process.env.EMAIL_PROVIDER_API_URL;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!endpoint || !apiKey) return { sent: false, reason: "email-provider-not-configured" };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ to: message.to, subject: message.subject, text: message.text, dedupeKey: message.dedupeKey }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
  return { sent: true };
}
