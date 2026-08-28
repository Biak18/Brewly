-- Server-authoritative cart repricing. Cart lines cache unit_price at
-- add-time; promotions and menu edits happen server-side afterwards, so the
-- cart screen needs to re-derive current prices. item_price_parts holds the
-- single source of truth (coffee + options + automatic codeless promo):
-- order_item_unit_price (checkout validation) and expected_cart_prices
-- (cart refresh) both derive from it, so they can never disagree.

create or replace function public.item_price_parts(p_item jsonb, p_store_id uuid)
returns table(unit_price numeric, full_price numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  coffee_row public.coffees%rowtype;
  option_total numeric := 0;
  option_label text;
  option_type text;
  promo_row public.promotions%rowtype;
begin
  select * into coffee_row
  from public.coffees
  where id = (p_item->>'coffee_id')::uuid
    and store_id = p_store_id
    and is_active = true;

  if not found then raise exception 'Coffee is unavailable for this store'; end if;

  foreach option_type in array array['size', 'temperature', 'milk'] loop
    option_label := nullif(trim(p_item->>option_type), '');
    if option_label is not null then
      if not exists (
        select 1 from public.coffee_options o
        where o.store_id = p_store_id
          and o.type = option_type
          and lower(trim(o.label)) = lower(option_label)
      ) then raise exception 'Invalid coffee option'; end if;

      option_total := option_total + coalesce((
        select o.price_delta from public.coffee_options o
        where o.store_id = p_store_id
          and o.type = option_type
          and lower(trim(o.label)) = lower(option_label)
        order by o.id
        limit 1
      ), 0);
    end if;
  end loop;

  for option_label in
    select trim(value)
    from jsonb_array_elements_text(coalesce(p_item->'extras', '[]'::jsonb)) as values(value)
  loop
    if not exists (
      select 1 from public.coffee_options o
      where o.store_id = p_store_id
        and o.type = 'extra'
        and lower(trim(o.label)) = lower(option_label)
    ) then raise exception 'Invalid coffee extra'; end if;

    option_total := option_total + coalesce((
      select o.price_delta from public.coffee_options o
      where o.store_id = p_store_id
        and o.type = 'extra'
        and lower(trim(o.label)) = lower(option_label)
      order by o.id
      limit 1
    ), 0);
  end loop;

  -- Automatic promotion: active, in date range, store-scoped, NO voucher code
  -- (vouchers are redeemed explicitly at checkout via p_promo_code).
  -- Priority: coffee > category > all, most recently created first.
  select * into promo_row
  from public.promotions p
  where p.store_id = p_store_id
    and p.code is null
    and p.is_active = true
    and p.starts_at <= current_date
    and p.ends_at >= current_date
    and (
      (p.scope = 'coffee' and p.coffee_id = coffee_row.id)
      or (p.scope = 'category' and p.category_id = coffee_row.category_id)
      or p.scope = 'all'
    )
  order by
    case p.scope when 'coffee' then 1 when 'category' then 2 else 3 end,
    p.created_at desc
  limit 1;

  full_price := round((coffee_row.base_price + option_total)::numeric, 2);
  if found then
    unit_price := round(round(coffee_row.base_price * (1 - promo_row.discount_percent / 100), 2) + option_total, 2);
  else
    unit_price := full_price;
  end if;

  return next;
end;
$$;

create or replace function public.order_item_unit_price(p_item jsonb, p_store_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  expected numeric;
begin
  select parts.unit_price into expected
  from public.item_price_parts(p_item, p_store_id) parts;

  if round(coalesce((p_item->>'unit_price')::numeric, -1), 2) <> expected then
    raise exception 'Menu price changed; refresh your cart';
  end if;

  return expected;
end;
$$;

-- Batch re-price for the cart refresh flow. Returns one row per input item,
-- in input order. unit_price is null when the item can no longer be priced
-- (coffee removed/deactivated, option no longer valid) so the client can
-- drop the line. full_price is the undiscounted base + add-ons, used as the
-- compare-at price for savings display.
create or replace function public.expected_cart_prices(p_items jsonb, p_store_id uuid)
returns table(item_index int, unit_price numeric, full_price numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  idx int := 0;
  item jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return;
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    item_index := idx;
    begin
      select parts.unit_price, parts.full_price
      into unit_price, full_price
      from public.item_price_parts(item, p_store_id) parts;
    exception when others then
      unit_price := null;
      full_price := null;
    end;
    return next;
    idx := idx + 1;
  end loop;
end;
$$;

revoke all on function public.item_price_parts(jsonb, uuid) from public;
revoke all on function public.order_item_unit_price(jsonb, uuid) from public;
revoke all on function public.expected_cart_prices(jsonb, uuid) from public;
grant execute on function public.expected_cart_prices(jsonb, uuid) to authenticated;
