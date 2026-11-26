-- Todug: үнэгүй долоо хоногийн хязгаар (0004-ийн дараа нэг удаа ажиллуулна)
--   Үнэгүй долоо хоног нь хүүхдийн ярианы түвшнээс хамаардаг тул түвшнийг сольж олон шатыг
--   үнэгүй үзэхээс сэргийлж, нэг бүртгэлд хамгийн ихдээ 2 өөр шатыг үнэгүй нээнэ.
begin;

create table if not exists todug.free_units (
  user_id uuid not null references auth.users (id) on delete cascade,
  unit int not null check (unit between 0 and 10),
  created_at timestamptz not null default now(),
  primary key (user_id, unit)
);
alter table todug.free_units enable row level security;
-- Policy байхгүй: зөвхөн доорх функцээр дамжина
revoke all on todug.free_units from public, anon, authenticated;
grant all on todug.free_units to service_role;

-- Тухайн шатыг үнэгүй нээж болох эсэх. Өмнө нээсэн шат бол true; шинэ шат бол хязгаарт багтвал бүртгээд true.
create or replace function todug.claim_free_unit(p_unit int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_limit constant int := 2;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if p_unit is null or p_unit not between 0 and 10 then return false; end if;
  if exists (select 1 from todug.free_units where user_id = v_uid and unit = p_unit) then return true; end if;
  -- Зэрэг ирсэн хүсэлтүүд хязгаарыг давуулахгүйн тулд хэрэглэгчээр түгжинэ
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 42));
  if (select count(*) from todug.free_units where user_id = v_uid) >= v_limit then return false; end if;
  insert into todug.free_units (user_id, unit) values (v_uid, p_unit) on conflict do nothing;
  return true;
end $$;

revoke all on function todug.claim_free_unit(int) from public, anon;
grant execute on function todug.claim_free_unit(int) to authenticated, service_role;

-- Админы имэйл
update todug.admins set email = 'moogii5596@gmail.com' where email = 'mnmkbt4@gmail.com';
insert into todug.admins (email) values ('moogii5596@gmail.com') on conflict do nothing;

commit;

notify pgrst, 'reload schema';
