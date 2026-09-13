# Production readiness review — 13 September 2026

Status: **not ready for real customer traffic**. Local fixes pass lint, production compilation, and targeted security tests. No deployment or remote database migration was performed. Interactive visual QA could not run because no browser was connected.

## Completed fixes

- Constrained the public reservation layout, aligned its back link, reduced oversized card spacing and type, wrapped its status row, and made service cards stack on narrow screens.
- Added explicit submit types to reservation lookup, service editing, and customer editing buttons.
- Fixed the OTP resend countdown and error handling; moved login navigation out of render; restricted redirect destinations; prevented expired-cookie login loops; gated studio content on session verification.
- Added API request timeouts and storage fallback. New bookings wait for API acceptance before local success. Rescheduling no longer sends a duplicate booking creation request. Failed call dispatch removes its optimistic activity entry.
- Required authentication for booking reads/updates, call reads/dispatch, and uploads. Added upload limits, booking payload validation, JSON error handling, strong production signing-secret checks, an owner email allowlist, cryptographic OTPs, resend cooldown, and production email/calling fail-closed behavior.
- Database errors no longer masquerade as successful in-memory booking writes. Live service pricing is read on the server. Added RLS schema statements and a separate migration to restrict direct Data API access. The backend now requires a service-role key for database access.

## Remaining launch blockers

1. The shared store still loads seeded data and persists business, services, customers, bookings, payments, settings, cancellations, and reschedules in localStorage. Most mutations have no corresponding server endpoints. Public reservation lookup only searches that browser's store. Implement authoritative API reads and writes for all flows, authenticated owner access, and scoped customer reservation access before launch.
2. New customers are created only in the local UI; the booking endpoint expects an existing database customer. Supabase seed service IDs, prices, location, and staff differ from frontend seed data. Unify the data model, migrate seed data deliberately, and create customer + booking + activity in one transaction.
3. Implement database-enforced prevention of overlapping staff appointments, server-side opening hours/notice validation, consistent business timezone handling, idempotency, and atomic rescheduling. The current local availability calculation and memory duplicate check cannot protect concurrent live bookings.
4. The online gateway is simulated; transfer receipts and approval are browser-local. Integrate the chosen payment provider, verify signed payment webhooks server-side, store receipts securely, and calculate confirmation status from verified payments.
5. Replace the fixed September 12, 2026 demo clock throughout scheduling, activity timestamps, and booking creation. Use an explicit Africa/Lagos business clock with hydration-safe rendering and advancing time.
6. OTP challenges are in process memory. Add durable shared storage before running multiple replicas. OWNER_EMAILS currently authorizes a single Bloom workspace; multi-business membership and query scoping are not implemented.
7. Configure and verify Supabase, email, voice, hosting origins, signing secret, OWNER_EMAILS, proxy hop count, and cron credentials. Webhook updates now require AETHEX_WEBHOOK_SECRET in x-webhook-secret; verify the provider can supply that header or implement its documented signature scheme before enabling delivery. Apply ../backend/supabase/migrations/20260913_restrict_direct_access.sql with a database owner connection. Review existing policies on an existing database: enabling RLS does not remove pre-existing permissive policies.
8. Run browser interaction and screenshot checks at mobile and desktop sizes, then live staging checks across two independent customer/studio sessions. The screenshot issue has a layout fix, but no browser-based visual confirmation was possible in this session.

## Local verification

Frontend: `pnpm lint`, `pnpm build`, `node --test tests/navigation.test.mjs` (Node 22.18+ for native TypeScript stripping).
Backend: `pnpm test` builds and tests against an isolated environment without external integrations.
