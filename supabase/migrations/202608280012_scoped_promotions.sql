create or replace function public.create_order_with_delivery_fee(
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
  existing_order_id uuid;
  item jsonb;
  item_price numeric;
  eligible_subtotal numeric := 0;
  calculated_subtotal numeric := 0;
  calculated_tax numeric;
  calculated_discount numeric := 0;
  promo_discount numeric := 0;
  loyalty_discount numeric := 0;
  calculated_delivery numeric;
  calculated_total numeric;
  quantity integer;
  cheapest_item numeric := null;
  promo_row public.promotions%rowtype;
  item_category_id uuid;
  order_id uuid;
  card_stamps integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 100 then raise exception 'Invalid idempotency key'; end if;

  if nullif(trim(p_idempotency_key), '') is not null then
    select id into existing_order_id from public.orders
    where user_id = auth.uid() and idempotency_key = trim(p_idempotency_key) limit 1;
    if existing_order_id is not null then return existing_order_id; end if;
  end if;

  if p_fulfillment not in ('pickup', 'delivery') then raise exception 'Invalid fulfillment'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Order must contain items'; end if;
  if not exists (select 1 from public.stores where id = p_store_id) then raise exception 'Store not found'; end if;
  if p_fulfillment = 'delivery' and nullif(trim(p_delivery_address), '') is null then raise exception 'Delivery address required'; end if;
  if p_fulfillment = 'pickup' and p_delivery_address is not null then raise exception 'Pickup orders cannot include a delivery address'; end if;
  if coalesce(p_tip, 0) < 0 or coalesce(p_tip, 0) > 100 then raise exception 'Invalid tip'; end if;

  for item in select value from jsonb_array_elements(p_items) loop
    quantity := (item->>'quantity')::integer;
    if quantity is null or quantity < 1 or quantity > 99 then raise exception 'Invalid quantity'; end if;
    item_price := public.order_item_unit_price(item, p_store_id);
    calculated_subtotal := calculated_subtotal + item_price * quantity;
    if cheapest_item is null or item_price < cheapest_item then cheapest_item := item_price; end if;
  end loop;
  calculated_subtotal := round(calculated_subtotal, 2);
  calculated_tax := round(calculated_subtotal * 0.08, 2);
  calculated_delivery := case when p_fulfillment = 'delivery' then 1.50 else 0 end;

  if nullif(trim(p_promo_code), '') is not null then
    select * into promo_row from public.promotions
    where store_id = p_store_id and is_active = true
      and upper(code) = upper(trim(p_promo_code))
      and starts_at <= current_date and ends_at >= current_date
    limit 1;
    if not found then raise exception 'Promotion is not valid'; end if;
    if promo_row.scope not in ('all', 'category', 'coffee') then raise exception 'Promotion scope is invalid'; end if;

    for item in select value from jsonb_array_elements(p_items) loop
      item_price := public.order_item_unit_price(item, p_store_id);
      select category_id into item_category_id from public.coffees where id = (item->>'coffee_id')::uuid;
      if promo_row.scope = 'all'
        or (promo_row.scope = 'coffee' and promo_row.coffee_id = (item->>'coffee_id')::uuid)
        or (promo_row.scope = 'category' and promo_row.category_id = item_category_id)
      then
        eligible_subtotal := eligible_subtotal + item_price * (item->>'quantity')::integer;
      end if;
    end loop;
    promo_discount := round(eligible_subtotal * promo_row.discount_percent / 100, 2);
  end if;

  if p_redeem_loyalty then
    select stamps into card_stamps from public.loyalty_cards
    where user_id = auth.uid() and store_id = p_store_id for update;
    if coalesce(card_stamps, 0) < 10 then raise exception 'Loyalty reward is no longer available'; end if;
    loyalty_discount := least(coalesce(cheapest_item, 0), calculated_subtotal - promo_discount);
    update public.loyalty_cards set stamps = stamps - 10, updated_at = now()
    where user_id = auth.uid() and store_id = p_store_id and stamps >= 10;
    if not found then raise exception 'Loyalty reward is no longer available'; end if;
  end if;

  calculated_discount := round(promo_discount + loyalty_discount, 2);
  calculated_total := round(calculated_subtotal + calculated_tax + calculated_delivery + coalesce(p_tip, 0) - calculated_discount, 2);

  insert into public.orders (
    user_id, store_id, fulfillment, subtotal, tax, total, discount, tip,
    promo_code, delivery_fee, delivery_address, idempotency_key, status, payment_status
  ) values (
    auth.uid(), p_store_id, p_fulfillment, calculated_subtotal, calculated_tax,
    calculated_total, calculated_discount, coalesce(p_tip, 0),
    nullif(trim(p_promo_code), ''), calculated_delivery, p_delivery_address,
    nullif(trim(p_idempotency_key), ''), 'received', 'unpaid'
  ) returning id into order_id;

  for item in select value from jsonb_array_elements(p_items) loop
    item_price := public.order_item_unit_price(item, p_store_id);
    insert into public.order_items (
      order_id, coffee_id, size, temperature, milk, extras, quantity, unit_price, compare_at_price
    ) values (
      order_id, (item->>'coffee_id')::uuid, nullif(item->>'size', ''), nullif(item->>'temperature', ''),
      nullif(item->>'milk', ''), array(select jsonb_array_elements_text(coalesce(item->'extras', '[]'::jsonb))),
      (item->>'quantity')::integer, item_price, null
    );
  end loop;
  return order_id;
exception
  when unique_violation then
    select id into existing_order_id from public.orders
    where user_id = auth.uid() and idempotency_key = nullif(trim(p_idempotency_key), '') limit 1;
    if existing_order_id is not null then return existing_order_id; end if;
    raise;
end;
$$;

revoke all on function public.create_order_with_delivery_fee(uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric, numeric, text, boolean, text) from public;
grant execute on function public.create_order_with_delivery_fee(uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric, numeric, text, boolean, text) to authenticated;
