-- Todug: хүүхдийн профайл ба ахицын хүснэгт
create table if not exists public.todug_children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default '',
  years int not null check (years between 0 and 12),
  months int not null check (months between 0 and 11),
  sex text not null check (sex in ('boy', 'girl')),
  stage int not null check (stage between 0 and 4),
  comp text not null check (comp in ('yes', 'some', 'no')),
  flags text[] not null default '{}',
  likes text[] not null default '{}',
  minutes int not null default 20,
  created_at timestamptz not null default now()
);

create table if not exists public.todug_progress (
  child_id uuid not null references public.todug_children (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week int not null check (week between 0 and 3),
  day int not null check (day between 1 and 7),
  created_at timestamptz not null default now(),
  primary key (child_id, week, day)
);

alter table public.todug_children enable row level security;
alter table public.todug_progress enable row level security;

-- Хэрэглэгч зөвхөн өөрийн мөрийг харж, өөрчилнө
create policy todug_children_owner on public.todug_children
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy todug_progress_owner on public.todug_progress
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index if not exists todug_children_user_idx on public.todug_children (user_id);
create index if not exists todug_progress_user_idx on public.todug_progress (user_id);

-- Зөвхөн нэвтэрсэн хэрэглэгч хандана
revoke all on public.todug_children, public.todug_progress from anon;
grant select, insert, update, delete on public.todug_children, public.todug_progress to authenticated;
