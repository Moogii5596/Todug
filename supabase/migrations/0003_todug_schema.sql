-- Todug: хүснэгтүүдийг тусдаа `todug` schema руу зөөнө (0002-ийн дараа нэг удаа ажиллуулна)
--   Supabase-ийн Data API-д зөвхөн `todug` schema-г нээнэ (Project Settings → API → Exposed schemas).
--   Ингэснээр нэг төсөлд хамт байгаа бусад аппын `public` хүснэгтүүд API-аар ил гарахгүй.
--   RLS policy, индекс, шалгуур, эрхүүд хүснэгттэйгээ хамт зөөгдөнө.
begin;

create schema if not exists todug;

alter table if exists public.todug_children      set schema todug;
alter table if exists public.todug_progress      set schema todug;
alter table if exists public.todug_game_requests set schema todug;

do $$
begin
  if to_regprocedure('public.todug_delete_account()') is not null then
    alter function public.todug_delete_account() set schema todug;
  end if;
end $$;

-- Зөвхөн нэвтэрсэн хэрэглэгч (болон серверийн service_role) хандана
revoke all on schema todug from public, anon;
grant usage on schema todug to authenticated, service_role;

-- Цаашид энэ schema-д нэмэгдэх зүйлд анхдагчаар эрх өгөхгүй
alter default privileges in schema todug revoke all on tables from public, anon, authenticated;
alter default privileges in schema todug revoke all on functions from public, anon;

commit;

notify pgrst, 'reload schema';
