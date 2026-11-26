-- Todug: сануулгын мэдэгдэл (0006-ын дараа нэг удаа ажиллуулна)
--   push_subscriptions: хэрэглэгчийн хөтөч бүрийн Web Push бүртгэл. Мөр байгаа нь сануулга асаалттай гэсэн үг.
--   Хэрэглэгч зөвхөн өөрийн мөрийг үүсгэж, устгана. Илгээхдээ сервер service_role-оор уншина.
begin;

create table if not exists todug.push_subscriptions (
  endpoint text primary key check (char_length(endpoint) between 10 and 1000 and endpoint like 'https://%'),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) between 10 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on todug.push_subscriptions (user_id);

alter table todug.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_owner on todug.push_subscriptions;
create policy push_subscriptions_owner on todug.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, delete on todug.push_subscriptions to authenticated;
grant all on todug.push_subscriptions to service_role;

commit;

notify pgrst, 'reload schema';
