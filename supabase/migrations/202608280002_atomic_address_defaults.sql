-- Keep the newest default when repairing any pre-existing duplicates.
with ranked_defaults as (
  select id,
         row_number() over (
           partition by user_id
           order by created_at desc, id desc
         ) as position
  from public.addresses
  where is_default = true
)
update public.addresses a
set is_default = false
from ranked_defaults r
where a.id = r.id
  and r.position > 1;

create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses (user_id)
  where is_default = true;

create or replace function public.set_default_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  address_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select user_id into address_user_id
  from public.addresses
  where id = p_address_id
  for update;

  if not found or address_user_id <> auth.uid() then
    raise exception 'Address not found';
  end if;

  update public.addresses
  set is_default = false
  where user_id = auth.uid()
    and id <> p_address_id;

  update public.addresses
  set is_default = true
  where id = p_address_id
    and user_id = auth.uid();
end;
$$;

revoke all on function public.set_default_address(uuid) from public;
grant execute on function public.set_default_address(uuid) to authenticated;
