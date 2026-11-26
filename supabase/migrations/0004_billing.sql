-- Todug: төлбөр (0003-ийн дараа нэг удаа ажиллуулна)
--   Хэрэглэгч багц сонгож захиалга үүсгэнэ, дансаар шилжүүлэхдээ гүйлгээний утгад захиалгын дугаараа бичнэ.
--   Админ дансны хуулгаа шалгаад захиалгыг "төлсөн" болгоно. Эрх тэр мөчөөс тоологдоно.
--   Хэрэглэгч захиалгын мөрийг шууд бичиж, өөрчилж чадахгүй: бүгд доорх функцээр дамжина.
begin;

-- ============ 1. Багц, үнэ ============
-- Үнийг өөрчлөхдөө: update todug.plans set amount = ... where id = 'm1';
create table if not exists todug.plans (
  id text primary key,
  label text not null,
  months int not null check (months between 1 and 24),
  amount int not null check (amount > 0),          -- төгрөгөөр
  active boolean not null default true,
  sort int not null default 0
);
insert into todug.plans (id, label, months, amount, sort) values
  ('m1', '1 сар', 1, 19900, 1),
  ('m3', '3 сар', 3, 49900, 2)
on conflict (id) do nothing;

-- ============ 2. Админ ============
-- Админ нэмэхдээ: insert into todug.admins values ('имэйл@жишээ.мн');  (жижиг үсгээр)
create table if not exists todug.admins (
  email text primary key check (email = lower(email))
);
insert into todug.admins (email) values ('mnmkbt4@gmail.com') on conflict do nothing;

-- ============ 3. Захиалга ============
create table if not exists todug.orders (
  id bigint generated always as identity primary key,
  code text not null unique,                       -- гүйлгээний утгад бичих дугаар
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references todug.plans (id),
  months int not null,
  amount int not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  access_until timestamptz                         -- "paid" үед эрх дуусах хугацаа
);
create index if not exists orders_user_idx on todug.orders (user_id, created_at desc);
create index if not exists orders_status_idx on todug.orders (status, created_at desc);
-- Нэг хэрэглэгчид нэг л хүлээгдэж буй захиалга
create unique index if not exists orders_one_pending_idx on todug.orders (user_id) where status = 'pending';

alter table todug.plans enable row level security;
alter table todug.admins enable row level security;
alter table todug.orders enable row level security;

drop policy if exists plans_read on todug.plans;
create policy plans_read on todug.plans for select to authenticated using (active);
drop policy if exists orders_own on todug.orders;
create policy orders_own on todug.orders for select to authenticated using (user_id = (select auth.uid()));
-- todug.admins-д policy байхгүй: зөвхөн доорх security definer функцүүд уншина

revoke all on todug.plans, todug.admins, todug.orders from public, anon, authenticated;
grant select on todug.plans, todug.orders to authenticated;
grant all on todug.plans, todug.admins, todug.orders to service_role;

-- ============ 4. Функцүүд ============
-- Имэйл нь баталгаажсан, админы жагсаалтад байгаа хэрэглэгч
create or replace function todug.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
      join todug.admins a on a.email = lower(u.email)
     where u.id = (select auth.uid()) and u.email_confirmed_at is not null);
$$;

-- Төлбөртэй хичээл, нэмэлт тоглоомыг үзэх эрхтэй эсэх
create or replace function todug.has_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select todug.is_admin() or exists (
    select 1 from todug.orders o
     where o.user_id = (select auth.uid()) and o.status = 'paid' and o.access_until > now());
$$;

-- Захиалга үүсгэнэ. Ижил багцын хүлээгдэж буй захиалга байвал түүнийг буцаана,
-- өөр багц сонговол хуучныг цуцалж шинийг үүсгэнэ.
create or replace function todug.create_order(p_plan text)
returns todug.orders language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_plan todug.plans;
  v_order todug.orders;
begin
  if v_uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into v_plan from todug.plans where id = p_plan and active;
  if not found then raise exception 'unknown plan' using errcode = '22023'; end if;

  select * into v_order from todug.orders where user_id = v_uid and status = 'pending' for update;
  if found then
    if v_order.plan_id = v_plan.id and v_order.amount = v_plan.amount then return v_order; end if;
    update todug.orders set status = 'cancelled', decided_at = now() where id = v_order.id;
  end if;

  if (select count(*) from todug.orders where user_id = v_uid and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'too many orders' using errcode = 'P0001';
  end if;

  for i in 1..20 loop
    begin
      insert into todug.orders (code, user_id, plan_id, months, amount)
      values ('T' || lpad(floor(random() * 1000000)::int::text, 6, '0'), v_uid, v_plan.id, v_plan.months, v_plan.amount)
      returning * into v_order;
      return v_order;
    exception when unique_violation then
      -- Дугаар давхцсан бол дахин оролдоно; зэрэг ирсэн хүсэлт аль хэдийн үүсгэсэн бол түүнийг буцаана
      select * into v_order from todug.orders where user_id = v_uid and status = 'pending';
      if found then return v_order; end if;
    end;
  end loop;
  raise exception 'could not allocate order code';
end $$;

-- Админ: захиалгын жагсаалт (p_status: pending | paid | cancelled | all; p_q: дугаар эсвэл имэйлээр хайх)
create or replace function todug.admin_orders(p_status text default 'pending', p_q text default '')
returns table (id bigint, code text, email text, plan_label text, months int, amount int, status text,
               created_at timestamptz, decided_at timestamptz, access_until timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_q text := btrim(coalesce(p_q, ''));
begin
  if not todug.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select o.id, o.code, u.email::text, p.label, o.months, o.amount, o.status,
           o.created_at, o.decided_at, o.access_until
      from todug.orders o
      join auth.users u on u.id = o.user_id
      join todug.plans p on p.id = o.plan_id
     where (p_status = 'all' or o.status = p_status)
       and (v_q = '' or position(lower(v_q) in lower(o.code)) > 0 or position(lower(v_q) in lower(u.email)) > 0)
     order by o.created_at desc
     limit 200;
end $$;

-- Админ: захиалгыг "төлсөн" эсвэл "цуцалсан" болгоно
create or replace function todug.admin_set_order(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_order todug.orders;
  v_base timestamptz;
begin
  if not todug.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_order from todug.orders where id = p_id for update;
  if not found then raise exception 'order not found' using errcode = '22023'; end if;

  if p_status = 'paid' then
    if v_order.status = 'paid' then return; end if;
    -- Хүчинтэй эрх байвал түүний төгсгөлөөс, үгүй бол одооноос сунгана
    select greatest(now(), coalesce(max(o.access_until), now())) into v_base
      from todug.orders o where o.user_id = v_order.user_id and o.status = 'paid' and o.id <> v_order.id;
    update todug.orders
       set status = 'paid', decided_at = now(), decided_by = auth.uid(),
           access_until = v_base + make_interval(months => v_order.months)
     where id = p_id;
  elsif p_status = 'cancelled' then
    update todug.orders
       set status = 'cancelled', decided_at = now(), decided_by = auth.uid(), access_until = null
     where id = p_id;
  else
    raise exception 'bad status' using errcode = '22023';
  end if;
end $$;

revoke all on function todug.is_admin(), todug.has_access(), todug.create_order(text),
  todug.admin_orders(text, text), todug.admin_set_order(bigint, text) from public, anon;
grant execute on function todug.is_admin(), todug.has_access(), todug.create_order(text),
  todug.admin_orders(text, text), todug.admin_set_order(bigint, text) to authenticated, service_role;

commit;

notify pgrst, 'reload schema';
