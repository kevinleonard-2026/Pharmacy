# Integration Notes

## Supabase

Set `SUPABASE_URL` and either `SUPABASE_SERVICE_ROLE_KEY` for server-side repository work or `SUPABASE_ANON_KEY` for restricted client-safe operations. The server creates the client lazily in `server/integrations.ts`; no credentials are embedded in source code. Supabase can serve as the authenticated Postgres-backed adapter while the typed tRPC contract remains unchanged.

## MongoDB

Set `MONGODB_URI` to enable the lazy MongoDB client. Medicine records are modeled with document-friendly fields, and `scheduleTimes` can be represented as an embedded array when the Mongo repository is introduced. The current app does not connect until the variable is present.

## Reminders

The application exposes `POST /api/scheduled/reminders` and a protected `reminders.schedule` procedure. The procedure creates a platform-managed scheduled job using a six-field UTC cron expression, then persists the returned `scheduleCronTaskUid` to the owner's reminder configuration. The callback authenticates the scheduled identity and looks up configuration by task UID, which keeps execution idempotent and avoids trusting request-body identifiers.

The scheduled callback is intentionally not activated against production until the project is deployed and a reminder configuration is created. This prevents development-only URLs from becoming unreachable scheduled targets.

## Email delivery

In-app reminder presentation is available immediately. Email delivery is provider-agnostic by design: add a mail provider secret and an adapter at the callback's delivery point, then persist a delivery key for deduplication. Until a provider is connected, the product clearly labels email as ready for connection rather than implying that email has been sent.
