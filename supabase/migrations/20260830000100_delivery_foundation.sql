-- Delivery foundation: drivers, driver assignment, and delivery order states.
-- Extends the existing order lifecycle:
--   received -> preparing -> ready
--     pickup :                -> completed
--     delivery:               -> driver_assigned -> out_for_delivery -> delivered

-- 1. Drivers (a driver is a profile with role = 'driver').
create table if not exists public.drivers (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  vehicle text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.drivers enable row level security;

drop policy if exists "drivers select" on public.drivers;
create policy "drivers select" on public.drivers
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'seller'
    )
  );

drop policy if exists "drivers insert" on public.drivers;
create policy "drivers insert" on public.drivers
  for insert with check (auth.uid() = id);

drop policy if exists "drivers update" on public.drivers;
create policy "drivers update" on public.drivers
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 2. Link orders to a driver.
alter table public.orders
  add column if not exists driver_id uuid references public.drivers (id) on delete set null;
alter table public.orders
  add column if not exists delivered_at timestamptz;
create index if not exists orders_driver_id_idx on public.orders (driver_id);

-- 3. Allow drivers to see/update their assigned orders.
drop policy if exists "orders select" on public.orders;
create policy "orders select" on public.orders
  for select using (
    auth.uid() = user_id
    or public.is_store_owner(store_id)
    or driver_id = auth.uid()
  );

drop policy if exists "orders update" on public.orders;
create policy "orders update" on public.orders
  for update using (
    auth.uid() = user_id
    or public.is_store_owner(store_id)
    or driver_id = auth.uid()
  )
  with check (
    auth.uid() = user_id
    or public.is_store_owner(store_id)
    or driver_id = auth.uid()
  );

-- 4. Extend status transitions with the delivery leg.
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
  order_store_id uuid;
  order_driver_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in (
    'received', 'preparing', 'ready', 'completed',
    'driver_assigned', 'out_for_delivery', 'delivered', 'cancelled'
  ) then
    raise exception 'Invalid order status';
  end if;

  select status, store_id, driver_id into current_status, order_store_id, order_driver_id
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'Order not found'; end if;

  -- Delivery-leg transitions may be performed by the store owner or the
  -- assigned driver; everything else is store-owner only.
  if p_status in ('driver_assigned', 'out_for_delivery', 'delivered') then
    if not (public.is_store_owner(order_store_id) or order_driver_id = auth.uid()) then
      raise exception 'Not authorized';
    end if;
  else
    if not public.is_store_owner(order_store_id) then
      raise exception 'Order not found';
    end if;
  end if;

  if current_status = 'cancelled' or p_status = current_status then
    raise exception 'Invalid order transition';
  end if;

  if not (
    (current_status = 'received' and p_status = 'preparing') or
    (current_status = 'preparing' and p_status in ('received', 'ready')) or
    (current_status = 'ready' and p_status in ('preparing', 'completed', 'driver_assigned')) or
    (current_status = 'driver_assigned' and p_status in ('ready', 'out_for_delivery')) or
    (current_status = 'out_for_delivery' and p_status in ('driver_assigned', 'delivered')) or
    (current_status = 'delivered' and p_status = 'out_for_delivery') or
    (current_status = 'completed' and p_status = 'ready')
  ) then
    raise exception 'Invalid order transition';
  end if;

  update public.orders
  set status = p_status,
      ready_at = case when p_status = 'ready' then coalesce(ready_at, now()) else ready_at end,
      completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
      delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_status(uuid, text) from public;
grant execute on function public.update_order_status(uuid, text) to authenticated;

-- 5. Assign an available driver to a ready delivery order (store owner only).
create or replace function public.assign_driver(
  p_order_id uuid,
  p_driver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_store_id uuid;
  order_status text;
  order_fulfillment text;
  driver_available boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select store_id, status, fulfillment
    into order_store_id, order_status, order_fulfillment
  from public.orders
  where id = p_order_id;

  if not found or not public.is_store_owner(order_store_id) then
    raise exception 'Order not found';
  end if;
  if order_status <> 'ready' then raise exception 'Order is not ready for assignment'; end if;
  if order_fulfillment <> 'delivery' then raise exception 'Order is not a delivery'; end if;

  select is_available into driver_available from public.drivers where id = p_driver_id;
  if driver_available is null then raise exception 'Driver not found'; end if;

  update public.orders
  set driver_id = p_driver_id, status = 'driver_assigned'
  where id = p_order_id;
end;
$$;

revoke all on function public.assign_driver(uuid, uuid) from public;
grant execute on function public.assign_driver(uuid, uuid) to authenticated;
