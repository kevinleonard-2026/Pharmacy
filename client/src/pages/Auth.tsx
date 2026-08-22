import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronLeft, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";

type AuthMode = "signin" | "signup" | "forgot";

export const getAuthValidationError = (mode: AuthMode, email: string, password = "") => !email.includes("@") ? (mode === "forgot" ? "Enter a valid email address." : "Use a valid email address and password with at least 8 characters.") : mode !== "forgot" && password.length < 8 ? "Use a valid email address and password with at least 8 characters." : "";
export const getAuthSuccessMessage = (mode: AuthMode) => mode === "signup" ? "Account creation is ready for Supabase Auth connection. Secure sign-in remains available now." : "If the account exists, recovery instructions will be sent securely.";
export const getAuthModeAfterAction = (action: "signin" | "signup" | "forgot" | "back") => action === "back" ? "signin" : action;
export const shouldUseSecureHandoff = (mode: AuthMode) => mode === "signin";

export const modeCopy: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  signin: { eyebrow: "RETURN TO WORKSPACE / 01", title: "Welcome back.", description: "Continue organizing your medication schedule with less friction.", submit: "Sign in securely" },
  signup: { eyebrow: "CREATE YOUR WORKSPACE / 02", title: "Start with clarity.", description: "Set up a private medication workspace designed around your routine.", submit: "Create account" },
  forgot: { eyebrow: "RECOVER ACCESS / 03", title: "Reset your access.", description: "Enter your email and we’ll prepare the next step for your secure account recovery.", submit: "Send reset link" },
};

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const copy = modeCopy[mode];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const validationError = getAuthValidationError(mode, email, password);
    if (validationError) { setMessage(validationError); return; }
    if (shouldUseSecureHandoff(mode)) { startLogin(); return; }
    setMessage(getAuthSuccessMessage(mode));
  };

  return <main className="auth-page"><div className="auth-grid" /><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
    <section className="auth-shell">
      <div className="auth-brand"><div className="brand-mark"><span /><span /><span /></div><span>MEDGRID / 01</span><small>PHARMACY CHECKLIST</small></div>
      <div className="auth-panel blueprint-frame"><div className="auth-panel-line" /><div className="auth-coordinate">AUTH / {mode === "signin" ? "01" : mode === "signup" ? "02" : "03"} <span>UTC+LOCAL</span></div>
        <div className="auth-copy"><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.description}</p></div>
        <div className="auth-switcher" role="tablist" aria-label="Authentication options"><button className={mode === "signin" ? "active" : ""} onClick={() => { setMode(getAuthModeAfterAction("signin")); setMessage(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode(getAuthModeAfterAction("signup")); setMessage(""); }}>Create account</button></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && <label><span>Full name</span><div className="auth-input"><Sparkles size={15} /><input name="name" autoComplete="name" placeholder="Your name" /></div></label>}
          <label><span>Email address</span><div className="auth-input"><Mail size={15} /><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div></label>
          {mode !== "forgot" && <label><span>Password <small>8+ characters</small></span><div className="auth-input"><LockKeyhole size={15} /><input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>}
          {mode === "signup" && <label className="auth-check"><input type="checkbox" required /><span>I agree to keep my medication information private and use this tool for organization.</span></label>}
          {mode === "signin" && <button type="button" className="forgot-link" onClick={() => { setMode(getAuthModeAfterAction("forgot")); setMessage(""); }}>Forgot password?</button>}
          <Button type="submit" className="auth-submit">{copy.submit}<ArrowUpRight size={16} /></Button>
          {message && <p className="auth-message" role="status">{message}</p>}
        </form>
        {mode === "forgot" && <button className="back-link" onClick={() => setMode(getAuthModeAfterAction("back"))}><ChevronLeft size={14} /> Back to sign in</button>}
        <div className="auth-assurance"><ShieldCheck size={16} /><span><strong>Private by design</strong><small>Secure authentication · No passwords stored in the browser</small></span><KeyRound size={15} /></div>
      </div>
      <div className="auth-footer"><span>ORGANIZE WITH CONFIDENCE</span><span>01 / 03</span></div>
    </section>
  </main>;
}
