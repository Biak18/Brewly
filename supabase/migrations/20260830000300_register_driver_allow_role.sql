-- Update register_driver to set the app.allow_role_change session flag before
-- flipping the caller's role to "driver". This is the same escape hatch the
-- existing prevent_direct_role_change trigger uses for become_seller(), so we
-- don't need to alter the trigger itself.
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
  perform set_config('app.allow_role_change', 'true', true);

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
