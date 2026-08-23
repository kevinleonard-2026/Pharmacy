import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const LIVE_BACKGROUND_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_092641_de52eb87-daf2-41db-92cb-7a56eae012a5.mp4";

export type AuthMode = "signin" | "signup" | "forgot";

export const modeCopy: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  signin: { eyebrow: "RETURN TO WORKSPACE / 01", title: "Welcome back.", description: "Continue organizing your medication schedule with less friction.", submit: "Sign in securely" },
  signup: { eyebrow: "CREATE YOUR WORKSPACE / 02", title: "Start with clarity.", description: "Set up a private medication workspace designed around your routine.", submit: "Create account" },
  forgot: { eyebrow: "RECOVER ACCESS / 03", title: "Reset your access.", description: "Enter your email and we’ll prepare the next step for your secure account recovery.", submit: "Send reset link" },
};

export const getAuthValidationError = (modeOrEmail: AuthMode | string, emailOrPassword: string, password = "") => {
  const mode = modeOrEmail === "signin" || modeOrEmail === "signup" || modeOrEmail === "forgot" ? modeOrEmail : "signin";
  const email = mode === modeOrEmail ? emailOrPassword : modeOrEmail;
  const actualPassword = mode === modeOrEmail ? password : emailOrPassword;
  if (!email.includes("@")) return mode === "forgot" ? "Enter a valid email address." : "Use a valid email address and password with at least 8 characters.";
  if (mode !== "forgot" && actualPassword.length < 8) return "Use a valid email address and password with at least 8 characters.";
  return "";
};

export const getAuthSuccessMessage = (mode: AuthMode) => mode === "signup" ? "Account creation is ready for Supabase Auth connection. Secure sign-in remains available now." : "If the account exists, recovery instructions will be sent securely.";
export const getAuthModeAfterAction = (action: "signin" | "signup" | "forgot" | "back") => action === "back" ? "signin" : action;
export const shouldUseSecureHandoff = (mode: AuthMode) => mode === "signin";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: false });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Sign in · Apogee";
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const validationError = getAuthValidationError("signin", email, password);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    startLogin();
  };

  return (
    <main className="apogee-auth relative min-h-screen overflow-hidden bg-[#080A19] text-white">
      <video className="fixed inset-0 w-full h-full object-cover" src={LIVE_BACKGROUND_VIDEO} autoPlay loop muted playsInline aria-hidden="true" />
      <div className="apogee-auth-overlay fixed inset-0" aria-hidden="true" />
      <div className="relative z-10 min-h-screen px-5 py-5 sm:px-8 sm:py-8 lg:px-[82px] flex flex-col">
        <header className="flex items-center justify-between max-w-[1800px] w-full mx-auto">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Return to Apogee home">
            <svg width="28" height="28" viewBox="0 0 256 256" fill="none" className="sm:w-[32px] sm:h-[32px]" aria-hidden="true">
              <path
                fill="white"
                d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 156.654 128 64 L 128 128 L 0 128 L 0 0 Z"
              />
            </svg>
            <span className="text-[22px] sm:text-[26px] font-[450] tracking-[-0.02em]">Apogee</span>
          </Link>
          <span className="apogee-auth-meta">PRIVATE ACCESS / 01</span>
        </header>

        <div className="flex-1 flex items-center justify-center py-10">
          <section className="apogee-login-card w-full max-w-[480px] rounded-[24px] sm:rounded-[32px] p-6 sm:p-10" aria-labelledby="login-title">
            <div className="apogee-card-kicker"><span /> AUTHENTICATED WORKSPACES</div>
            <div className="mt-8 sm:mt-10">
              <p className="apogee-eyebrow mb-4">RETURN TO WORKSPACE / 01</p>
              <h1 id="login-title" className="text-[42px] sm:text-[56px] leading-[0.94] font-normal tracking-[-0.05em] mb-5">Welcome back.</h1>
              <p className="text-white/70 text-[15px] sm:text-[17px] leading-[1.45] max-w-[350px]">Continue organizing your medication schedule with less friction.</p>
            </div>

            {loading ? (
              <div className="apogee-auth-loading" role="status">Checking your workspace session…</div>
            ) : user ? (
              <div className="apogee-auth-session">
                <div>
                  <span className="apogee-session-label">SIGNED IN AS</span>
                  <strong>{user.name || user.email || "your account"}</strong>
                </div>
                <button type="button" onClick={() => setLocation("/cabinet")} className="apogee-submit">
                  Enter workspace <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <form className="apogee-login-form" onSubmit={submit}>
                <label>
                  <span>Email address</span>
                  <div className="apogee-input-wrap">
                    <Mail size={17} aria-hidden="true" />
                    <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                  </div>
                </label>
                <label>
                  <span>Password <small>8+ characters</small></span>
                  <div className="apogee-input-wrap">
                    <LockKeyhole size={17} aria-hidden="true" />
                    <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" minLength={8} required />
                    <button type="button" className="apogee-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <button type="button" className="apogee-forgot" onClick={() => setMessage("Use the secure sign-in portal to recover access to your account.")}>Forgot password?</button>
                <button type="submit" className="apogee-submit">Sign in securely <ArrowRight size={17} /></button>
                {message && <p className="apogee-auth-message" role="status">{message}</p>}
              </form>
            )}

            <div className="apogee-assurance">
              <ShieldCheck size={18} />
              <span><strong>Private by design</strong><small>Secure authentication · Your data stays in your workspace</small></span>
            </div>
          </section>
        </div>

        <footer className="apogee-auth-footer max-w-[1800px] w-full mx-auto"><span>APOGEE / ORGANIZE WITH CONFIDENCE</span><span><Link href="/">BACK TO HOME</Link></span></footer>
      </div>
    </main>
  );
}
