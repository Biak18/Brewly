-- Fix driver status updates blocked by prevent_customer_status_change trigger.
-- The trigger previously only allowed the store owner (or customer cancelling) to change status,
-- so update_order_status called by the assigned driver was rejected with
-- "Only the store owner can change order status" even though the RPC itself allowed it.
-- Allow the assigned driver to advance/revert the delivery steps.
create or replace function public.prevent_customer_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if new.status = 'cancelled'
     and old.status = 'received'
     and new.user_id = auth.uid() then
    return new;
  end if;

  -- Assigned driver may move the delivery lifecycle.
  if coalesce(old.driver_id, new.driver_id) = auth.uid()
     and new.status in ('driver_assigned', 'out_for_delivery', 'delivered')
     and old.status in ('ready', 'driver_assigned', 'out_for_delivery', 'delivered') then
    return new;
  end if;

  if old.status is distinct from new.status and not is_store_owner(new.store_id) then
    raise exception 'Only the store owner can change order status';
  end if;
  return new;
end;
$function$;
