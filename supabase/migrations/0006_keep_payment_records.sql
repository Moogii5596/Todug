-- Todug: бүртгэл устсан ч төлсөн захиалгын бүртгэл хадгалагдана (0005-ийн дараа нэг удаа ажиллуулна)
--   Захиалга устах бүрд (бүртгэл устахад cascade-аар устдаг) төлсөн захиалгыг todug.orders_archive руу хуулна.
--   Хэрэглэгч устсаны дараа имэйлийг нь олох боломжгүй тул захиалга үүсэх үед имэйлийг мөрд нь хадгална.
begin;

alter table todug.orders add column if not exists email text;
update todug.orders o set email = lower(u.email) from auth.users u where u.id = o.user_id and o.email is null;

create table if not exists todug.orders_archive (
  id bigint primary key,
  code text not null,
  email text,
  plan_id text not null,
  months int not null,
  amount int not null,
  created_at timestamptz not null,
  decided_at timestamptz,
  access_until timestamptz,
  deleted_at timestamptz not null default now()
);
alter table todug.orders_archive enable row level security;
-- Policy байхгүй: зөвхөн админы функцээр уншина
revoke all on todug.orders_archive from public, anon, authenticated;
grant all on todug.orders_archive to service_role;

create or replace function todug.orders_keep_paid()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status = 'paid' then
    insert into todug.orders_archive (id, code, email, plan_id, months, amount, created_at, decided_at, access_until)
    values (old.id, old.code, old.email, old.plan_id, old.months, old.amount, old.created_at, old.decided_at, old.access_until)
    on conflict (id) do nothing;
  end if;
  return old;
end $$;
revoke all on function todug.orders_keep_paid() from public, anon, authenticated;

create or replace trigger orders_keep_paid
  before delete on todug.orders
  for each row execute function todug.orders_keep_paid();

-- Захиалга үүсгэхдээ имэйлийг хадгална; архивлагдсан дугаартай давхцахгүй
create or replace function todug.create_order(p_plan text)
returns todug.orders language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_plan todug.plans;
  v_order todug.orders;
  v_email text;
  v_code text;
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

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;

  for i in 1..20 loop
    v_code := 'T' || lpad(floor(random() * 1000000)::int::text, 6, '0');
    continue when exists (select 1 from todug.orders_archive a where a.code = v_code);
    begin
      insert into todug.orders (code, user_id, email, plan_id, months, amount)
      values (v_code, v_uid, v_email, v_plan.id, v_plan.months, v_plan.amount)
      returning * into v_order;
      return v_order;
    exception when unique_violation then
      select * into v_order from todug.orders where user_id = v_uid and status = 'pending';
      if found then return v_order; end if;
    end;
  end loop;
  raise exception 'could not allocate order code';
end $$;

-- Админы жагсаалтад бүртгэл нь устсан хэрэглэгчийн төлсөн захиалгыг "archived" төлөвтэйгээр хамт харуулна
create or replace function todug.admin_orders(p_status text default 'pending', p_q text default '')
returns table (id bigint, code text, email text, plan_label text, months int, amount int, status text,
               created_at timestamptz, decided_at timestamptz, access_until timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare v_q text := lower(btrim(coalesce(p_q, '')));
begin
  if not todug.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select x.id, x.code, x.email, coalesce(p.label, x.months || ' сар'), x.months, x.amount, x.status,
           x.created_at, x.decided_at, x.access_until
      from (
        select o.id, o.code, coalesce(o.email, lower(u.email))::text as email, o.plan_id, o.months, o.amount,
               o.status, o.created_at, o.decided_at, o.access_until
          from todug.orders o join auth.users u on u.id = o.user_id
        union all
        select a.id, a.code, coalesce(a.email, ''), a.plan_id, a.months, a.amount,
               'archived', a.created_at, a.decided_at, a.access_until
          from todug.orders_archive a
      ) x
      left join todug.plans p on p.id = x.plan_id
     where (p_status = 'all' or x.status = p_status or (p_status = 'paid' and x.status = 'archived'))
       and (v_q = '' or position(v_q in lower(x.code)) > 0 or position(v_q in lower(x.email)) > 0)
     order by x.created_at desc
     limit 200;
end $$;

commit;

notify pgrst, 'reload schema';
