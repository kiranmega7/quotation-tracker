-- Apply this on existing QuoteTracker DB to enable per-user isolation.

alter table public.quotes
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists quotes_user_id on public.quotes (user_id);

alter table public.quotes
  alter column user_id set default auth.uid();

-- Assign existing null user_id rows to first created auth user.
do $$
declare
  first_user_id uuid;
begin
  select id into first_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if first_user_id is null then
    raise exception 'No users found in auth.users. Create at least one account first.';
  end if;

  update public.quotes
  set user_id = first_user_id
  where user_id is null;
end;
$$;

create or replace function public.set_quote_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_set_user_id on public.quotes;
create trigger quotes_set_user_id
  before insert on public.quotes
  for each row execute procedure public.set_quote_user_id();

alter table public.quotes
  alter column user_id set not null;

alter table public.quotes enable row level security;
alter table public.follow_ups enable row level security;
alter table public.notes enable row level security;

drop policy if exists "quotes_all" on public.quotes;
drop policy if exists "follow_ups_all" on public.follow_ups;
drop policy if exists "notes_all" on public.notes;

drop policy if exists "quotes_select_own" on public.quotes;
drop policy if exists "quotes_insert_own" on public.quotes;
drop policy if exists "quotes_update_own" on public.quotes;
drop policy if exists "quotes_delete_own" on public.quotes;
drop policy if exists "follow_ups_select_own" on public.follow_ups;
drop policy if exists "follow_ups_insert_own" on public.follow_ups;
drop policy if exists "follow_ups_update_own" on public.follow_ups;
drop policy if exists "follow_ups_delete_own" on public.follow_ups;
drop policy if exists "notes_select_own" on public.notes;
drop policy if exists "notes_insert_own" on public.notes;
drop policy if exists "notes_update_own" on public.notes;
drop policy if exists "notes_delete_own" on public.notes;

create policy "quotes_select_own" on public.quotes
  for select using (auth.uid() = user_id);
create policy "quotes_insert_own" on public.quotes
  for insert with check (auth.uid() = user_id);
create policy "quotes_update_own" on public.quotes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quotes_delete_own" on public.quotes
  for delete using (auth.uid() = user_id);

create policy "follow_ups_select_own" on public.follow_ups
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = follow_ups.quote_id and q.user_id = auth.uid()
    )
  );
create policy "follow_ups_insert_own" on public.follow_ups
  for insert with check (
    exists (
      select 1 from public.quotes q
      where q.id = follow_ups.quote_id and q.user_id = auth.uid()
    )
  );
create policy "follow_ups_update_own" on public.follow_ups
  for update using (
    exists (
      select 1 from public.quotes q
      where q.id = follow_ups.quote_id and q.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.quotes q
      where q.id = follow_ups.quote_id and q.user_id = auth.uid()
    )
  );
create policy "follow_ups_delete_own" on public.follow_ups
  for delete using (
    exists (
      select 1 from public.quotes q
      where q.id = follow_ups.quote_id and q.user_id = auth.uid()
    )
  );

create policy "notes_select_own" on public.notes
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = notes.quote_id and q.user_id = auth.uid()
    )
  );
create policy "notes_insert_own" on public.notes
  for insert with check (
    exists (
      select 1 from public.quotes q
      where q.id = notes.quote_id and q.user_id = auth.uid()
    )
  );
create policy "notes_update_own" on public.notes
  for update using (
    exists (
      select 1 from public.quotes q
      where q.id = notes.quote_id and q.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.quotes q
      where q.id = notes.quote_id and q.user_id = auth.uid()
    )
  );
create policy "notes_delete_own" on public.notes
  for delete using (
    exists (
      select 1 from public.quotes q
      where q.id = notes.quote_id and q.user_id = auth.uid()
    )
  );
