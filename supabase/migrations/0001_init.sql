-- Todug: хүүхдийн профайл ба ахицын хүснэгт
create table if not exists public.children (
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

create table if not exists public.progress (
  child_id uuid not null references public.children (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week int not null check (week between 0 and 3),
  day int not null check (day between 1 and 7),
  created_at timestamptz not null default now(),
  primary key (child_id, week, day)
);

alter table public.children enable row level security;
alter table public.progress enable row level security;

-- Хэрэглэгч зөвхөн өөрийн мөрийг харж, өөрчилнө
create policy "children_owner" on public.children
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "progress_owner" on public.progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists children_user_idx on public.children (user_id);
