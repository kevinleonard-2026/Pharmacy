import { describe, expect, it } from "vitest";
import { getAuthModeAfterAction, getAuthSuccessMessage, getAuthValidationError, modeCopy, shouldUseSecureHandoff } from "../client/src/pages/Auth";

describe("authentication page states", () => {
  it("rejects invalid credentials and accepts a valid forgot-password email", () => {
    expect(getAuthValidationError("signin", "bad", "short")).toContain("valid email");
    expect(getAuthValidationError("forgot", "bad")).toBe("Enter a valid email address.");
    expect(getAuthValidationError("forgot", "person@example.com")).toBe("");
  });

  it("returns safe account-creation and recovery messages", () => {
    expect(getAuthSuccessMessage("signup")).toContain("Supabase Auth");
    expect(getAuthSuccessMessage("forgot")).toContain("If the account exists");
  });

  it("switches authentication modes and keeps secure handoff limited to sign-in", () => {
    expect(getAuthModeAfterAction("signup")).toBe("signup");
    expect(getAuthModeAfterAction("forgot")).toBe("forgot");
    expect(getAuthModeAfterAction("back")).toBe("signin");
    expect(shouldUseSecureHandoff("signin")).toBe(true);
    expect(shouldUseSecureHandoff("signup")).toBe(false);
    expect(shouldUseSecureHandoff("forgot")).toBe(false);
  });

  it("includes sign-in, create-account, and forgot-password experiences", () => {
    expect(modeCopy.signin.submit).toBe("Sign in securely");
    expect(modeCopy.signup.submit).toBe("Create account");
    expect(modeCopy.forgot.submit).toBe("Send reset link");
    expect(modeCopy.forgot.title).toBe("Reset your access.");
  });
});
