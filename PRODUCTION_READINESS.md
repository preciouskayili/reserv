# Customer readiness review — 27 September 2026

Local implementation checks pass. Production launch remains unverified. The current detailed review is in [the backend launch report](../backend/LAUNCH.md), with deployment steps in [RAILWAY.md](../backend/RAILWAY.md).

This replaces the 13 September review: its browser-local storage, simulated checkout, fixed demo-clock and single-workspace blockers have since been addressed. Customer data now uses scoped backend workspaces, booking conflicts are checked on the server, and hosted payments use verified provider results. This does not establish that production integrations are configured or working.

## Changes in this pass

- Business phone setup is automatic with one dedicated number per business. Repeated setup requests reuse the existing number. Customers can skip phone setup and start taking bookings immediately.
- Payment methods hide disabled Stripe and Paystack providers. Transfer receipt submission remains available; existing pending checkout protection is preserved.
- Outbound calls use a named identity check and their actual purpose; inbound calls retain the inquiry and booking welcome.
- Settings practice calls explicitly identify the sample appointment, start with an empty destination number, and cannot alter real customer records through voice tools.
- Uncertain call requests tell staff to check history before dialing again. The call request timeout allows the backend's provider request to complete.
- Customer records retain the optional call opt-out field across workspace saves.
- Both repositories pin the patched pnpm 11.11.0.

## Validation

Frontend lint, production build and all 12 tests pass. The backend build and all 55 tests pass, including one-number provisioning, inbound booking and changes, outbound call context, opt-outs and practice-call isolation. The isolated PostgreSQL payment suite passes. Frozen lockfile installs succeed and both production dependency audits report no known vulnerabilities.

## Remaining checks

The local backend production preflight rejects its JWT secret, development origins/default email sender, and missing voice webhook/tool configuration. Online-checkout credentials are also absent locally. Confirm the actual deployed settings and use a public HTTPS `NEXT_PUBLIC_API_URL` when building this frontend.

The production backend passes read-only health, authentication and public database lookup checks; both hosted payment providers are disabled as intended. The latest source changes remain local and need deployment. No production frontend URL or Browser connection was available for interactive mobile/desktop QA. No live call, email delivery, payment or deployed agent update was performed in this pass. Complete the controlled release checks on the deployed URLs before accepting customer traffic.
