# Reserv — interface prototype

A clickable service-business booking prototype for Bloom Studio. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and customized shadcn/ui primitives.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Next.js. Other projects may already be using port 3000.

For the location card, copy `.env.example` to `.env.local` and add a Google Maps API key with Maps Embed API enabled. The card shows a standard Google map for the studio address. Without a key, it links out to Google Maps.

## Explore

- `/` — owner's seven-day calendar, with a single-day view when needed
- `/calendar` — redirects to the calendar home
- `/bookings` and `/bookings/[id]` — reservation list and detail
- `/customers`, `/services`, `/business-profile`, `/agent`, `/settings` — owner workspace
- `/b/bloom-studio` — public studio page and account-free booking flow
- `/reservation` — find a reservation by its six-character code
- `/r/[code]` — customer reservation page; try `7FQ9KD` or `A82LPR`

This is an end-to-end **mock interface**. It uses a fixed demo day of September 12, 2026 at 10:15 AM WAT, so the calendar stays useful whenever you open it. Edits and new reservations persist only in the current browser's `localStorage`; Settings can reset the demo. The model and seed data live in `src/lib/reserv/`. The AI receptionist, phone calls, authentication, payments, and backend storage are not connected.

## Checks

```bash
pnpm build
pnpm lint
```
