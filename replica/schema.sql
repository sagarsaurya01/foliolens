-- MProfit clone ("FolioLens") — schema (Postgres / Supabase)
-- Money in integer paise. Holdings and capital gains are DERIVED from
-- transactions + prices, never stored as mutable columns.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  default_currency text not null default 'INR',
  created_at timestamptz not null default now()
);

-- family / grouping tree
create table groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  level text not null default 'individual' check (level in ('individual','family','custom')),
  created_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  name text not null,
  broker text,                                   -- e.g. Zerodha, Anand Rathi
  kind text not null default 'investment' check (kind in ('investment','trading')),
  created_at timestamptz not null default now()
);
create index on portfolios (user_id);

-- master security list (shared). asset_class drives pricing + tax treatment.
create table securities (
  id uuid primary key default gen_random_uuid(),
  symbol text,                                   -- NSE symbol
  isin text,                                     -- MF/equity ISIN (AMFI match)
  amfi_code text,                                -- AMFI scheme code for NAV join
  name text not null,
  asset_class text not null
    check (asset_class in ('equity','mf','bond','fd','nps','gold','reit','invit','cash','other')),
  exchange text,
  unique (isin),
  unique (symbol, exchange)
);

-- every money event. holdings + gains are computed from these rows.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  security_id uuid references securities(id) on delete restrict,
  txn_type text not null
    check (txn_type in ('buy','sell','dividend','bonus','split','merger','interest','expense')),
  trade_date date not null,
  quantity numeric(20,4) not null default 0,     -- units/shares (can be fractional for MF)
  price_minor bigint not null default 0,         -- per-unit price in paise
  charges_minor bigint not null default 0,       -- brokerage + taxes
  amount_minor bigint not null default 0,        -- net cash effect, signed
  note text,
  created_at timestamptz not null default now()
);
create index on transactions (portfolio_id, trade_date);
create index on transactions (security_id);

-- corporate actions applied to a security (adjust qty / cost basis)
create table corporate_actions (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references securities(id) on delete cascade,
  action_type text not null check (action_type in ('dividend','split','bonus','merger','demerger')),
  ex_date date not null,
  ratio_from numeric(20,4),                      -- e.g. split 1->5: from 1 to 5
  ratio_to numeric(20,4),
  amount_minor bigint,                           -- for dividends
  applied_at timestamptz
);

-- price cache (filled from AMFI / NSE). current + historical close.
create table price_quotes (
  security_id uuid not null references securities(id) on delete cascade,
  quote_date date not null,
  close_minor bigint not null,
  source text not null,                          -- 'amfi' | 'nse'
  primary key (security_id, quote_date)
);

-- DERIVED (computed in the data layer / SQL view), shown here as intent:
--  holding(portfolio, security) = Σ signed qty, Σ cost (FIFO lots kept in code),
--    current_value = qty * latest price_quote, unrealised = value - remaining cost.
--  capital_gain: FIFO-match each sell against prior buys ->
--    term by holding period & asset_class (equity LTCG > 12m; debt differs),
--    grandfathering: for equity bought <= 2018-01-31, cost = max(actual, 31-Jan-2018 FMV).

-- RLS: a row is visible only to its owning user (portfolios.user_id = auth.uid()),
--   securities + price_quotes are shared read-only. Policies in the first migration.
