alter function public.create_order(
  uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric,
  numeric, text, boolean, text
) rename to create_order_with_delivery_fee;

create or replace function public.create_order(
  p_store_id uuid,
  p_fulfillment text,
  p_subtotal numeric,
  p_tax numeric,
  p_total numeric,
  p_items jsonb,
  p_tip numeric default 0,
  p_promo_code text default null,
  p_discount numeric default 0,
  p_delivery_fee numeric default 0,
  p_delivery_address text default null,
  p_redeem_loyalty boolean default false,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  order_id uuid;
begin
  order_id := public.create_order_with_delivery_fee(
    p_store_id, p_fulfillment, p_subtotal, p_tax, p_total, p_items,
    p_tip, p_promo_code, p_discount, 0, p_delivery_address,
    p_redeem_loyalty, p_idempotency_key
  );

  update public.orders
  set delivery_fee = 0,
      total = round(total - 1.50, 2)
  where id = order_id
    and fulfillment = 'delivery'
    and delivery_fee = 1.50;

  return order_id;
end;
$$;

revoke all on function public.create_order(
  uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric,
  numeric, text, boolean, text
) from public;
grant execute on function public.create_order(
  uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric,
  numeric, text, boolean, text
) to authenticated;
