-- Todug: сайжруулалт (0001-ийн дараа нэг удаа ажиллуулна; дахин ажиллуулахад алдаа гарахгүй байхаар бичсэн)
--   1. Хүүхдийн насыг төрсөн сараар хадгална, шалгуурууд нэмнэ
--   2. Ахицыг долоо хоногоор биш хичээлийн шатаар (UNITS-ийн индекс) түлхүүрлэнэ
--   3. Ахицын RLS-ийн цоорхойг хаана
--   4. Тоглоом зохиох хүсэлтийн хязгаарын хүснэгт
--   5. Бүртгэлээ устгах функц
begin;

-- ============ 1. todug_children ============
alter table public.todug_children add column if not exists birth_month date;
alter table public.todug_children add column if not exists advance int not null default 0;

-- Нас (years, months)-ыг бүртгэсэн өдрөөс нь хасаж төрсөн сарыг тооцно, дараа нь хуучин багануудыг хасна
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'todug_children' and column_name = 'years')
     and exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'todug_children' and column_name = 'months') then
    execute $sql$
      update public.todug_children
         set birth_month = date_trunc('month', created_at - make_interval(years => years, months => months))::date
       where birth_month is null
    $sql$;
  end if;
end $$;

alter table public.todug_children alter column birth_month set not null;
alter table public.todug_children drop column if exists years;
alter table public.todug_children drop column if exists months;

-- Шинэ шалгуурт үл нийцэх хуучин мөрийг засна (ердийн хэрэглээнд ийм мөр байх ёсгүй)
update public.todug_children set name = left(btrim(name), 20) where char_length(name) > 20;
update public.todug_children set minutes = case when minutes < 15 then 10 when minutes < 25 then 20 else 30 end
 where minutes not in (10, 20, 30);
update public.todug_children c
   set flags = coalesce((select array_agg(f order by ord) from unnest(c.flags) with ordinality as t (f, ord)
                          where f = any (array['noName','noPoint','lowEye','hearing','regress','screen','sounds','stutter'])), '{}')
 where not (c.flags <@ array['noName','noPoint','lowEye','hearing','regress','screen','sounds','stutter']);
update public.todug_children c
   set likes = coalesce((select array_agg(l order by ord)
                           from (select l, ord from unnest(c.likes) with ordinality as t (l, ord)
                                  where l = any (array['car','animal','ball','food','doll','music','blocks'])
                                  order by ord limit 3) s), '{}')
 where cardinality(c.likes) > 3
    or not (c.likes <@ array['car','animal','ball','food','doll','music','blocks']);

-- stage-ийн хуучин шалгуурыг (автомат нэр нь todug_children_stage_check) нэрээс үл хамааран олж хасна
do $$
declare r record;
begin
  for r in
    select con.conname
      from pg_constraint con
     where con.conrelid = 'public.todug_children'::regclass
       and con.contype = 'c'
       and (con.conname = 'todug_children_stage_check'
            or (select array_agg(a.attname::text)
                  from pg_attribute a
                 where a.attrelid = con.conrelid and a.attnum = any (con.conkey)) = array['stage'])
  loop
    execute format('alter table public.todug_children drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.todug_children drop constraint if exists todug_children_advance_check;
alter table public.todug_children drop constraint if exists todug_children_minutes_check;
alter table public.todug_children drop constraint if exists todug_children_name_check;
alter table public.todug_children drop constraint if exists todug_children_likes_check;
alter table public.todug_children drop constraint if exists todug_children_flags_check;

alter table public.todug_children
  add constraint todug_children_stage_check check (stage between 0 and 5),
  add constraint todug_children_advance_check check (advance between 0 and 10),
  add constraint todug_children_minutes_check check (minutes in (10, 20, 30)),
  add constraint todug_children_name_check check (char_length(name) <= 20),
  add constraint todug_children_likes_check check (
    cardinality(likes) <= 3
    and likes <@ array['car','animal','ball','food','doll','music','blocks']),
  add constraint todug_children_flags_check check (
    flags <@ array['noName','noPoint','lowEye','hearing','regress','screen','sounds','stutter']);

-- ============ 2. todug_progress: долоо хоног -> хичээлийн шат ============
alter table public.todug_progress add column if not exists unit int;

-- Аппын buildPlan-тай ижил логикоор долоо хоногийг шат руу хөрвүүлнэ
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'todug_progress' and column_name = 'week') then
    execute $sql$
      update public.todug_progress p
         set unit = case
               when s.need_base and s.start > 0
                 then case when p.week = 0 then 0 else s.start + p.week - 1 end
               else s.start + p.week
             end
        from (select c.id,
                     (array[0, 2, 4, 6, 7])[least(c.stage, 4) + 1] as start,
                     (c.comp = 'no' or c.flags && array['noName', 'noPoint', 'lowEye']) as need_base
                from public.todug_children c) s
       where s.id = p.child_id
         and p.unit is null
    $sql$;
  end if;
end $$;

-- Шат нь тодорхойгүй эсвэл хязгаараас гарсан мөр үлдвэл хасна
delete from public.todug_progress where unit is null or unit not between 0 and 10;

-- Давхардсан (child_id, unit, day) мөр гарвал хамгийн эртнийхийг үлдээнэ
delete from public.todug_progress p
 using public.todug_progress q
 where p.child_id = q.child_id and p.unit = q.unit and p.day = q.day
   and (p.created_at, p.ctid) > (q.created_at, q.ctid);

-- Хуучин үндсэн түлхүүрийг нэрээс үл хамааран хасна
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
     where conrelid = 'public.todug_progress'::regclass and contype = 'p'
  loop
    execute format('alter table public.todug_progress drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.todug_progress drop column if exists week;
alter table public.todug_progress alter column unit set not null;
alter table public.todug_progress drop constraint if exists todug_progress_unit_check;
alter table public.todug_progress
  add constraint todug_progress_unit_check check (unit between 0 and 10),
  add constraint todug_progress_pkey primary key (child_id, unit, day);

-- ============ 3. RLS: ахицын мөр зөвхөн өөрийн хүүхдэд хамаарна ============
drop policy if exists todug_progress_owner on public.todug_progress;
create policy todug_progress_owner on public.todug_progress
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.todug_children c
                 where c.id = todug_progress.child_id and c.user_id = (select auth.uid()))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.todug_children c
                 where c.id = todug_progress.child_id and c.user_id = (select auth.uid()))
  );

-- ============ 4. Тоглоом зохиох хүсэлтийн хязгаар ============
create table if not exists public.todug_game_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists todug_game_requests_user_created_idx
  on public.todug_game_requests (user_id, created_at);

alter table public.todug_game_requests enable row level security;

drop policy if exists todug_game_requests_select on public.todug_game_requests;
drop policy if exists todug_game_requests_insert on public.todug_game_requests;
create policy todug_game_requests_select on public.todug_game_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy todug_game_requests_insert on public.todug_game_requests
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Хэрэглэгч тооллогоо арилгаж чадахгүй: update, delete эрх өгөхгүй
revoke all on public.todug_game_requests from anon, authenticated;
grant select, insert on public.todug_game_requests to authenticated;

-- ============ 5. Бүртгэлээ устгах ============
-- auth.users-ээс устгахад хүүхэд, ахиц, хүсэлтийн мөрүүд cascade-аар дагаж устна
create or replace function public.todug_delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.todug_delete_account() from public, anon;
grant execute on function public.todug_delete_account() to authenticated;

commit;
