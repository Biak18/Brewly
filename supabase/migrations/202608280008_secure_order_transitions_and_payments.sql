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
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_status not in ('received', 'preparing', 'ready', 'completed') then
    raise exception 'Invalid order status';
  end if;

  select status, store_id into current_status, order_store_id
  from public.orders
  where id = p_order_id
  for update;

  if not found or not public.is_store_owner(order_store_id) then
    raise exception 'Order not found';
  end if;
  if current_status = 'cancelled' or p_status = current_status then
    raise exception 'Invalid order transition';
  end if;
  if not (
    (current_status = 'received' and p_status = 'preparing') or
    (current_status = 'preparing' and p_status in ('received', 'ready')) or
    (current_status = 'ready' and p_status in ('preparing', 'completed')) or
    (current_status = 'completed' and p_status = 'ready')
  ) then
    raise exception 'Invalid order transition';
  end if;

  update public.orders
  set status = p_status,
      ready_at = case when p_status = 'ready' then coalesce(ready_at, now()) else ready_at end,
      completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else completed_at end
  where id = p_order_id;
end;
$$;

revoke all on function public.update_order_status(uuid, text) from public;
grant execute on function public.update_order_status(uuid, text) to authenticated;

create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.orders
  set status = 'cancelled'
  where id = p_order_id
    and user_id = auth.uid()
    and status = 'received';
  if not found then raise exception 'Order cannot be cancelled'; end if;
end;
$$;

revoke all on function public.cancel_order(uuid) from public;
grant execute on function public.cancel_order(uuid) to authenticated;

create or replace function public.attach_payment(
  p_order_id uuid,
  p_method text,
  p_ref text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_method not in ('kpay', 'mmqr') or nullif(trim(p_ref), '') is null then
    raise exception 'Invalid payment details';
  end if;
  update public.orders
  set payment_method = p_method,
      payment_ref = trim(p_ref),
      payment_status = 'awaiting_verification'
  where id = p_order_id
    and user_id = auth.uid()
    and status = 'received'
    and coalesce(payment_status, 'unpaid') in ('unpaid', 'awaiting_verification');
  if not found then raise exception 'Payment cannot be attached'; end if;
end;
$$;

revoke all on function public.attach_payment(uuid, text, text) from public;
grant execute on function public.attach_payment(uuid, text, text) to authenticated;

create or replace function public.set_payment_verified(
  p_order_id uuid,
  p_verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_store_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select store_id into order_store_id from public.orders where id = p_order_id;
  if not found or not public.is_store_owner(order_store_id) then
    raise exception 'Order not found';
  end if;
  update public.orders
  set payment_status = case when p_verified then 'verified' else 'unpaid' end
  where id = p_order_id
    and coalesce(payment_status, 'unpaid') = 'awaiting_verification';
  if not found then raise exception 'Payment is not awaiting verification'; end if;
end;
$$;

revoke all on function public.set_payment_verified(uuid, boolean) from public;
grant execute on function public.set_payment_verified(uuid, boolean) to authenticated;

revoke update(status) on public.orders from authenticated;
