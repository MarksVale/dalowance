# Dalowance

**Know what you can spend today.**

A daily allowance tracker for paycheck-to-paycheck users. One number — how much you can spend today without running short before your next paycheck. Self-correcting: if you spent less yesterday, today's number goes up.

---

## The formula

```
Daily allowance = (current balance − upcoming bills before payday − buffer) ÷ days until paycheck
```

Math is today-aware, not strictly daily — recalculates every time you update your balance.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel (auto-deploy from `main`) |
| Icons | lucide-react |

- **Supabase project:** `qcbbnpvjhmplquekqoap` (eu-central-1, Frankfurt)
- **GitHub:** `MarksVale/dalowance`

---

## Database schema

```sql
profiles (
  id uuid PK references auth.users,
  email text,
  paycheck_day int,         -- 1-31, day of month paycheck arrives
  paycheck_amount numeric,
  buffer_amount numeric default 0,  -- minimum to keep; excluded from daily calc
  language text default 'en',
  currency text default 'EUR',
  created_at, updated_at
)

balance_updates (
  id uuid PK,
  user_id uuid FK,
  balance numeric,          -- current account balance at time of update
  recorded_at timestamptz
)

bills (
  id uuid PK,
  user_id uuid FK,
  name text,
  amount numeric,
  day_of_month int,
  active boolean
)
```

- Trigger auto-creates `profiles` row on `auth.users` insert
- RLS enabled — all reads/writes restricted to row owner
- Migration: `supabase/migrations/0001_initial_schema.sql` (already applied)

---

## What's built ✅

| Route | What it does |
|-------|-------------|
| `/` | Landing page — magic link sign-in, redirects authed users to `/home` |
| `/home` | The Number: daily allowance, color-coded, delta vs last update, progress bar to payday, "What's next" upcoming events, "Last 7 days" bar chart |
| `/bills` | Month grid calendar with bills overlaid, list view, add/edit/delete modal |
| `/simulate` | What-if simulator — type a spend, see new allowance live |
| `/settings` | Edit paycheck day/amount/buffer, manage bills, sign out, delete account |
| `/onboarding/*` | 4-step wizard: balance → paycheck → bills → done |

**Auth:** Magic link via Supabase. Session refresh middleware on all protected routes.

**Theme:** Light/dark toggle (Sun/Moon icon, top-right). Persisted in `localStorage`. No flash on load via inline script in `<head>`.

**Color logic** (tied to `paycheck_amount / 30` as ideal daily):
- 🟢 Green: ≥70% of ideal
- 🟡 Amber: 30–69%
- 🔴 Red: <30%

---

## File structure

```
src/
  app/
    page.tsx                     — landing
    layout.tsx                   — root layout, theme script
    home/
      page.tsx                   — server component, fetches all data
      TheNumber.tsx              — animated count-up display
      ProgressBar.tsx            — days elapsed in pay cycle
      HomeActions.tsx            — "Update balance" + "Simulate" buttons
      UpdateBalanceModal.tsx     — modal for logging a new balance
      WhatsNext.tsx              — upcoming bills + paycheck events
      History.tsx                — last 7 days bar chart
      actions.ts                 — server actions: save balance update
    bills/
      page.tsx
      BillsClient.tsx            — calendar + list UI
      actions.ts                 — createBill, updateBill, deleteBill
    simulate/
      page.tsx
      SimulateClient.tsx
    settings/
      page.tsx
      SettingsClient.tsx         — all settings sections
      actions.ts                 — saveProfileSettings, deleteAccount
    onboarding/
      layout.tsx
      balance/page.tsx
      paycheck/page.tsx
      bills/
        page.tsx
        BillsForm.tsx
      done/page.tsx
      actions.ts                 — saveOnboarding (single transaction)
    auth/
      login/route.ts             — sends magic link
      callback/route.ts          — exchanges code for session
      signout/route.ts
  lib/
    supabase/
      client.ts                  — browser Supabase client
      server.ts                  — server Supabase client (Server Components)
      middleware.ts              — session refresh
    calc.ts                      — calcAllowance, allowanceColor, getUpcomingEvents, etc.
  components/
    theme-toggle.tsx
middleware.ts                    — root middleware, calls supabase session refresh
supabase/migrations/
  0001_initial_schema.sql
.env.local                       — NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (git-ignored)
```

---

## Style system

- `darkMode: 'class'` (Tailwind)
- Background: `bg-white dark:bg-zinc-950`
- Text: `text-zinc-900 dark:text-white`
- Subtle text: `text-zinc-600 dark:text-zinc-400`
- Borders: `border-zinc-200 dark:border-zinc-800`
- Cards: `bg-zinc-50 dark:bg-zinc-900`
- The Number: `text-7xl md:text-8xl font-bold tracking-tight`
- Transitions: `transition-colors duration-200` on themed elements
- Mobile-first, min 48px tap targets

---

## What's next ⏳

In priority order:

1. **Google OAuth** — add "Sign in with Google" alongside magic link (~15 min, free in Supabase)
2. **Landing page polish** — drop "magic link" wording, better tagline, mini preview of The Number
3. **Latvian translation** — i18n for EN + LV; defer until product is validated
4. **Salt Edge integration** — automated bank sync (v3, after manual flow is validated)

---

## Product principles (don't violate)

- **One number is the product.** Resist feature creep. Transaction logs, categories — not v1.
- **Manual balance entry is fine for MVP.** No bank API until validated.
- **Minimal friction.** Check balance once a day = 3 seconds.
- **Multi-step onboarding wizard** — sets a polished tone, not a single long form.
- **Today-aware math** — recalculates from current balance every time, not strict day-by-day.
- **Colors tied to user's paycheck**, not absolute euro amounts.
- **English first, Latvian later** — no other languages until validated.

---

## Market context

- Inspired by *Today's Budget* (iOS-only, Berlin). ADHD users love this category.
- Latvia-first, then global. Differentiators: Android-friendly PWA, EU localization, eventual Salt Edge bank sync.
- Local competition: Swedbank/SEB have basic budgeting; Revolut has spending categories. None do "one number until payday."
- Name "Dalowance" is a placeholder — likely rebrand before scaling.

---

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
