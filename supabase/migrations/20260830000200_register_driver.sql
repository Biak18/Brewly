-- Allow clients to update their own profile (name/avatar) but NOT the role
-- column. Role changes happen only through the SECURITY DEFINER register_driver
-- RPC, which can only set the caller's own role to "driver".
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

grant update on public.profiles to authenticated;

create or replace function public.register_driver(
  p_full_name text,
  p_phone text,
  p_vehicle text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.drivers (id, full_name, phone, vehicle, is_available)
  values (auth.uid(), p_full_name, p_phone, p_vehicle, true)
  on conflict (id) do update set
    full_name = coalesce(p_full_name, drivers.full_name),
    phone = coalesce(p_phone, drivers.phone),
    vehicle = coalesce(p_vehicle, drivers.vehicle),
    is_available = true;

  update public.profiles set role = 'driver' where id = auth.uid();
end;
$$;

grant execute on function public.register_driver(text, text, text) to authenticated;
