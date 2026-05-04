-- QuoteTracker — run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql

create extension if not exists "pgcrypto";

-- Quotes
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_number text,
  rfq_date date,
  quote_sent_date date,
  quote_value_sgd numeric(14, 2) not null default 0,
  profit_sgd numeric(14, 2) not null default 0,
  brand_description text,
  payment_terms text not null default '30 days'
    check (payment_terms in ('COD', '14 days', '30 days', '60 days')),
  status text not null default 'Quoted'
    check (status in (
      'Quoted',
      'Closed Won',
      'Closed Lost',
      'Checking With Supplier',
      'Part Number Issue',
      'Not Found'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_company_lower on public.quotes (lower(company_name));
create index quotes_status on public.quotes (status);
create index quotes_quote_sent_date on public.quotes (quote_sent_date);

-- Follow-up milestones (Day 3, 7, 14, 21 from quote sent date)
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  day_offset int not null check (day_offset in (3, 7, 14, 21)),
  follow_up_date date not null,
  unique (quote_id, day_offset)
);

create index follow_ups_quote_id on public.follow_ups (quote_id);
create index follow_ups_follow_up_date on public.follow_ups (follow_up_date);

-- Notes / remarks log
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index notes_quote_created on public.notes (quote_id, created_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute procedure public.set_updated_at();

-- Row Level Security (permissive for anon — tighten when you add Supabase Auth)
alter table public.quotes enable row level security;
alter table public.follow_ups enable row level security;
alter table public.notes enable row level security;

create policy "quotes_all" on public.quotes for all using (true) with check (true);
create policy "follow_ups_all" on public.follow_ups for all using (true) with check (true);
create policy "notes_all" on public.notes for all using (true) with check (true);
