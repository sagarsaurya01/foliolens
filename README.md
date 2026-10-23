# FolioLens

A clean-room multi-asset **portfolio tracker** in the style of MProfit — track
holdings across stocks and mutual funds, see live value, gains and XIRR, and
(next) a FIFO capital-gains report in ITR format. Built with the
[Replica](https://github.com/Jakeschincariol/replica-skill) method: it rebuilds
what the app *does*, never its code, brand, broker-import library or price feeds.

**Status:** Milestone 0 (working vertical slice). Sign in → create a portfolio →
add buys/sells → see live-valued holdings and a dashboard with gain + XIRR. All
numbers verified in the browser against seeded data.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Data is an in-memory seeded layer
today; the function signatures match a Supabase backend, which replaces it next
(`replica-backend`) without changing any screen. The daily price job will use the
free **AMFI NAV** and **NSE bhavdata** endpoints.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3200 and sign in with `sagar@demo.in`.

## The finance model (`lib/finance.ts`)

- Money is **integer paise**; mutual-fund quantities are fractional.
- **Holdings are derived**, never stored: FIFO lot matching from the transaction
  list; buy charges fold into cost, sell charges reduce proceeds.
- **Realised capital gains** come from the same FIFO pass (oldest lot first).
- **XIRR** is Newton's method over the dated cash flows plus today's value.

## What's next

Live pricing (AMFI + NSE), the **capital-gains report** with STCG/LTCG and
**grandfathering** (equity bought on/before 31-Jan-2018), corporate actions,
CAS/broker import (reusing the portfolio-extract work), family grouping, and the
Supabase backend. See `replica/features.csv` and `replica/build-log.md`.

> This shares its goal with the family investment system (whose target is to
> replace MProfit); it reuses that system's verified price endpoints.
