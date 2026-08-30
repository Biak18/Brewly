-- Extend the orders status CHECK constraint to allow the new delivery
-- lifecycle statuses introduced by the delivery foundation migration.
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status = any (array[
      'received'::text,
      'preparing'::text,
      'ready'::text,
      'driver_assigned'::text,
      'out_for_delivery'::text,
      'delivered'::text,
      'completed'::text,
      'cancelled'::text
    ])
  );
