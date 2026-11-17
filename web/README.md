# EyeFit: Optical Store Panel

Multi-store management for an optical retail chain: customers, eye tests (prescriptions), billing, and inventory.

**Stack:** Next.js 16 (App Router, JavaScript, Cache Components) · MongoDB + Mongoose · shadcn/ui (Base UI) + Tailwind v4

## Setup

```bash
npm install
cp .env.example .env.local      # set MONGODB_URI and SESSION_SECRET
npm run seed                    # wipes the DB and loads demo data
npm run dev
```

MongoDB should be a **replica set** (local `rs0` or Atlas) so bills are saved in a transaction.
On a standalone server it still works, just without transactions.

### Demo logins

| Username | Password | Access |
|---|---|---|
| `owner` | `owner123` | All 3 stores, settings, can cancel bills |
| `ef1` | `staff123` | Main Market (manager) |
| `ef2` | `staff123` | Station Road (staff) |
| `ef3` | `staff123` | City Mall (staff) |

## Keyboard shortcuts

| Key | Action |
|---|---|
| `F2` | New sale (from anywhere) |
| `Ctrl K` | Global search: customer, mobile, bill no, product |
| `/` | Focus the search box on list pages |
| `Ctrl S` | Save bill (New Sale) |
| `Ctrl Enter` | Save & print bill (New Sale) |

## Structure

```
src/
  app/
    login/                 login page
    (panel)/               top nav (desktop) + bottom tabs (mobile); all pages need login
      dashboard/           Home: launcher tiles, KPIs, 14-day sales chart, pickups, overdue
      sales/new/           ★ one-screen sale: Customer details · Billing details · Payment panels
      sales/               bills list + filters;  sales/[id] detail, delivery, payments
      customers/           list;  customers/[id] profile, Rx history, bills
      inventory/           catalogue + per-store stock, stock in
      settings/            stores & staff (read-only for now)
    print/                 invoice + workshop job card (print layouts)
  actions/                 server actions (auth, customers, sales, inventory, search)
  lib/
    auth.js                data access layer: user + active store; every query is store-scoped here
    session.js             signed JWT cookie (jose)
    billing.js             bill math, shared by client (live totals) and server (trusted totals)
  models/index.js          all Mongoose models
  proxy.js                 redirects to /login when there is no session (Next 16 "proxy" = middleware)
scripts/seed.mjs           demo data
```

### Notes for developers

- **Cache Components is on.** Anything that reads cookies or the DB must sit inside `<Suspense>`.
  Pages follow the pattern: a static header outside, then `<Suspense><DataComponent/></Suspense>`.
- Mutations call `refresh()` from `next/cache`. No `use cache` is used for business data.
- Store scoping: `getContext()` → `storeScope(ctx)` gives the Mongo filter. Writes that belong to a store
  (sale, stock in, eye test) use `requireActiveStore(ctx)`. The owner must pick a store when in "All Stores".
- Bill numbers come from a per-store counter: `EF1-00001`, `EF2-00001`, …
- Dates are grouped in `Asia/Kolkata` for the dashboard. Set `TZ=Asia/Kolkata` on the server for correct "today" boundaries.
