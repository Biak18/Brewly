-- Voucher-code promotions are redeemed explicitly at checkout (p_promo_code),
-- so they must not auto-apply to item prices. Mirrors the client change that
-- filters code IS NULL in fetchActivePromotions. Without this, a voucher
-- would discount displayed prices AND discount again at checkout.
create or replace function public.order_item_unit_price(p_item jsonb, p_store_id uuid)
returns numeric
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
  expected numeric;
  promo_row public.promotions%rowtype;
  discounted_base numeric;
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

  -- Automatic promotion: active, in date range, store-scoped, NO voucher code.
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

  if found then
    discounted_base := round(coffee_row.base_price * (1 - promo_row.discount_percent / 100), 2);
  else
    discounted_base := coffee_row.base_price;
  end if;

  expected := round(discounted_base + option_total, 2);
  if round(coalesce((p_item->>'unit_price')::numeric, -1), 2) <> expected then
    raise exception 'Menu price changed; refresh your cart';
  end if;

  return expected;
end;
$$;

revoke all on function public.order_item_unit_price(jsonb, uuid) from public;
grant execute on function public.order_item_unit_price(jsonb, uuid) to authenticated;
