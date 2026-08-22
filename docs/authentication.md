# MedGrid authentication

MedGrid presents three authentication states at `/auth`: **Sign in**, **Create account**, and **Forgot password**. The interface accepts credentials, validates the email/password shape locally, and displays safe, non-account-enumerating feedback.

The current sign-in submit action hands control to the existing secure Manus OAuth flow through `startLogin()`. Passwords are never persisted in React state beyond the native form interaction and are not written to local storage or the application database.

For a Supabase Auth credential deployment, configure the Supabase project URL and public anon key through the project secret manager, then replace the create-account and recovery message handlers with `supabase.auth.signUp({ email, password })` and `supabase.auth.resetPasswordForEmail(email, { redirectTo })`. Keep the service-role key server-side only. The backend should verify session ownership before reading medication data and should never log credentials or reset tokens.

Required configuration names are `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. The existing Manus auth flow remains the safe default until Supabase credentials and redirect URLs are connected.
