-- Todug: ахиц хянах (0005-ын дараа нэг удаа ажиллуулна)
--   words:      хүүхдийн хэлдэг, ойлгодог үгсийн хувийн бүртгэл (скрининг оноо биш)
--   week_goals: тухайн шатны долоо хоногт хэдэн өдөр хийхээр эцэг эх өөрөө тавьсан зорилго
--   checkins:   "зорилго биелсний шинж"-ээс ажиглагдсаныг тэмдэглэсэн байдал
--   Гурвуулаа todug_progress-ийн адил зөвхөн эзэмшигчид нээлттэй; хүүхэд эсвэл бүртгэл устахад хамт устна.
begin;

create table if not exists todug.words (
  child_id uuid not null references todug.todug_children (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word text not null check (char_length(word) between 1 and 30),
  kind text not null default 'says' check (kind in ('says', 'understands')),
  created_at timestamptz not null default now(),
  primary key (child_id, word)
);

create table if not exists todug.week_goals (
  child_id uuid not null references todug.todug_children (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit int not null check (unit between 0 and 10),
  days int not null check (days between 1 and 7),
  created_at timestamptz not null default now(),
  primary key (child_id, unit)
);

create table if not exists todug.checkins (
  child_id uuid not null references todug.todug_children (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  unit int not null check (unit between 0 and 10),
  signs int[] not null default '{}',              -- ажиглагдсан шинжийн дугаарууд (0-ээс)
  updated_at timestamptz not null default now(),
  primary key (child_id, unit)
);

alter table todug.words enable row level security;
alter table todug.week_goals enable row level security;
alter table todug.checkins enable row level security;

drop policy if exists words_owner on todug.words;
create policy words_owner on todug.words
  for all to authenticated
  using (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = words.child_id and c.user_id = (select auth.uid())))
  with check (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = words.child_id and c.user_id = (select auth.uid())));

drop policy if exists week_goals_owner on todug.week_goals;
create policy week_goals_owner on todug.week_goals
  for all to authenticated
  using (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = week_goals.child_id and c.user_id = (select auth.uid())))
  with check (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = week_goals.child_id and c.user_id = (select auth.uid())));

drop policy if exists checkins_owner on todug.checkins;
create policy checkins_owner on todug.checkins
  for all to authenticated
  using (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = checkins.child_id and c.user_id = (select auth.uid())))
  with check (user_id = (select auth.uid())
    and exists (select 1 from todug.todug_children c where c.id = checkins.child_id and c.user_id = (select auth.uid())));

grant select, insert, update, delete on todug.words, todug.week_goals, todug.checkins to authenticated;
grant all on todug.words, todug.week_goals, todug.checkins to service_role;

commit;

notify pgrst, 'reload schema';
