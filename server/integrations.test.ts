import { describe, expect, it, afterEach } from "vitest";
import { getIntegrationStatus } from "./integrations";
import { sendReminderEmail } from "./email";

describe("integration seams", () => {
  const original = { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY, mongo: process.env.MONGODB_URI, email: process.env.EMAIL_PROVIDER_API_URL, emailKey: process.env.EMAIL_PROVIDER_API_KEY };
  afterEach(() => {
    process.env.SUPABASE_URL = original.url;
    process.env.SUPABASE_ANON_KEY = original.key;
    process.env.MONGODB_URI = original.mongo;
    process.env.EMAIL_PROVIDER_API_URL = original.email;
    process.env.EMAIL_PROVIDER_API_KEY = original.emailKey;
  });

  it("reports optional providers without requiring credentials", () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.MONGODB_URI;
    expect(getIntegrationStatus()).toEqual({ supabaseConfigured: false, mongoConfigured: false });
  });

  it("returns an explicit safe outcome when email is not configured", async () => {
    delete process.env.EMAIL_PROVIDER_API_URL;
    delete process.env.EMAIL_PROVIDER_API_KEY;
    await expect(sendReminderEmail({ to: "test@example.com", subject: "Dose", text: "Review", dedupeKey: "dose-1" })).resolves.toEqual({ sent: false, reason: "email-provider-not-configured" });
  });
});
