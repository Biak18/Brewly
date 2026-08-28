create extension if not exists pgcrypto;

alter table public.stores
  add column if not exists kpay_phone text,
  add column if not exists payment_note text;

alter table public.orders
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists tip numeric(12,2) not null default 0,
  add column if not exists promo_code text,
  add column if not exists payment_method text,
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_ref text;

create or replace function public.is_store_owner(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores
    where id = p_store_id
      and owner_id = auth.uid()
  );
$$;

revoke all on function public.is_store_owner(uuid) from public;
grant execute on function public.is_store_owner(uuid) to anon, authenticated;

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
begin
  select * into coffee_row
  from public.coffees
  where id = (p_item->>'coffee_id')::uuid
    and store_id = p_store_id
    and is_active = true;

  if not found then
    raise exception 'Coffee is unavailable for this store';
  end if;

  foreach option_type in array array['size', 'temperature', 'milk'] loop
    option_label := nullif(p_item->>option_type, '');
    if option_label is not null then
      if not exists (
        select 1 from public.coffee_options
        where store_id = p_store_id and type = option_type and label = option_label
      ) then
        raise exception 'Invalid coffee option';
      end if;
      option_total := option_total + coalesce((
        select price_delta from public.coffee_options
        where store_id = p_store_id and type = option_type and label = option_label
        limit 1
      ), 0);
    end if;
  end loop;

  for option_label in select jsonb_array_elements_text(coalesce(p_item->'extras', '[]'::jsonb)) loop
    if not exists (
      select 1 from public.coffee_options
      where store_id = p_store_id and type = 'extra' and label = option_label
    ) then
      raise exception 'Invalid coffee extra';
    end if;
    option_total := option_total + coalesce((
      select price_delta from public.coffee_options
      where store_id = p_store_id and type = 'extra' and label = option_label
      limit 1
    ), 0);
  end loop;

  expected := round((coffee_row.base_price + option_total)::numeric, 2);
  if round(coalesce((p_item->>'unit_price')::numeric, -1), 2) <> expected then
    raise exception 'Menu price changed; refresh your cart';
  end if;
  return expected;
end;
$$;

revoke all on function public.order_item_unit_price(jsonb, uuid) from public;
grant execute on function public.order_item_unit_price(jsonb, uuid) to authenticated;

drop function if exists public.create_order(uuid, text, numeric, numeric, numeric, jsonb);

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
  p_redeem_loyalty boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  item_price numeric;
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
  order_id uuid;
  card_stamps integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_fulfillment not in ('pickup', 'delivery') then raise exception 'Invalid fulfillment'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain items';
  end if;
  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Store not found';
  end if;
  if p_fulfillment = 'delivery' and nullif(trim(p_delivery_address), '') is null then
    raise exception 'Delivery address required';
  end if;
  if p_fulfillment = 'pickup' and p_delivery_address is not null then
    raise exception 'Pickup orders cannot include a delivery address';
  end if;
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
    select * into promo_row
    from public.promotions
    where store_id = p_store_id
      and is_active = true
      and upper(code) = upper(trim(p_promo_code))
      and starts_at <= current_date
      and ends_at >= current_date
    limit 1;
    if not found then raise exception 'Promotion is not valid'; end if;
    if promo_row.scope <> 'all' then
      raise exception 'This promotion scope is not supported by checkout';
    end if;
    promo_discount := round(calculated_subtotal * promo_row.discount_percent / 100, 2);
  end if;

  if p_redeem_loyalty then
    select stamps into card_stamps
    from public.loyalty_cards
    where user_id = auth.uid() and store_id = p_store_id
    for update;
    if coalesce(card_stamps, 0) < 10 then raise exception 'Loyalty reward is no longer available'; end if;
    loyalty_discount := least(coalesce(cheapest_item, 0), calculated_subtotal - promo_discount);
    update public.loyalty_cards
    set stamps = stamps - 10, updated_at = now()
    where user_id = auth.uid() and store_id = p_store_id and stamps >= 10;
    if not found then raise exception 'Loyalty reward is no longer available'; end if;
  end if;

  calculated_discount := round(promo_discount + loyalty_discount, 2);
  calculated_total := round(calculated_subtotal + calculated_tax + calculated_delivery + coalesce(p_tip, 0) - calculated_discount, 2);

  insert into public.orders (
    user_id, store_id, fulfillment, subtotal, tax, total, discount, tip,
    promo_code, delivery_fee, delivery_address, status, payment_status
  ) values (
    auth.uid(), p_store_id, p_fulfillment, calculated_subtotal, calculated_tax,
    calculated_total, calculated_discount, coalesce(p_tip, 0),
    nullif(trim(p_promo_code), ''), calculated_delivery, p_delivery_address,
    'received', 'unpaid'
  ) returning id into order_id;

  for item in select value from jsonb_array_elements(p_items) loop
    item_price := public.order_item_unit_price(item, p_store_id);
    insert into public.order_items (
      order_id, coffee_id, size, temperature, milk, extras, quantity,
      unit_price, compare_at_price
    ) values (
      order_id, (item->>'coffee_id')::uuid, nullif(item->>'size', ''),
      nullif(item->>'temperature', ''), nullif(item->>'milk', ''),
      array(select jsonb_array_elements_text(coalesce(item->'extras', '[]'::jsonb))),
      (item->>'quantity')::integer,
      item_price, (item->>'compare_at_price')::numeric
    );
  end loop;
  return order_id;
end;
$$;

revoke all on function public.create_order(uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric, numeric, text, boolean) from public;
grant execute on function public.create_order(uuid, text, numeric, numeric, numeric, jsonb, numeric, text, numeric, numeric, text, boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.coffees enable row level security;
alter table public.coffee_options enable row level security;
alter table public.coffee_option_categories enable row level security;
alter table public.promotions enable row level security;
alter table public.favorites enable row level security;
alter table public.store_favorites enable row level security;
alter table public.addresses enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists stores_public_read on public.stores;
create policy stores_public_read on public.stores for select to anon, authenticated using (true);
drop policy if exists stores_owner_update on public.stores;
create policy stores_owner_update on public.stores for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_owner_write on public.categories;
create policy categories_owner_write on public.categories for all to authenticated
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
drop policy if exists coffees_public_read on public.coffees;
create policy coffees_public_read on public.coffees for select to anon, authenticated using (is_active = true or public.is_store_owner(store_id));
drop policy if exists coffees_owner_write on public.coffees;
create policy coffees_owner_write on public.coffees for all to authenticated
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
drop policy if exists coffee_options_public_read on public.coffee_options;
create policy coffee_options_public_read on public.coffee_options for select to anon, authenticated using (true);
drop policy if exists coffee_options_owner_write on public.coffee_options;
create policy coffee_options_owner_write on public.coffee_options for all to authenticated
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
drop policy if exists option_categories_public_read on public.coffee_option_categories;
create policy option_categories_public_read on public.coffee_option_categories for select to anon, authenticated using (true);
drop policy if exists option_categories_owner_write on public.coffee_option_categories;
create policy option_categories_owner_write on public.coffee_option_categories for all to authenticated
  using (exists (
    select 1 from public.coffee_options o
    where o.id = option_id and public.is_store_owner(o.store_id)
  ))
  with check (exists (
    select 1 from public.coffee_options o
    where o.id = option_id and public.is_store_owner(o.store_id)
  ));

drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions for select to anon, authenticated using (is_active = true or public.is_store_owner(store_id));
drop policy if exists promotions_owner_insert on public.promotions;
create policy promotions_owner_insert on public.promotions for insert to authenticated with check (public.is_store_owner(store_id));
drop policy if exists promotions_owner_update on public.promotions;
create policy promotions_owner_update on public.promotions for update to authenticated using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
drop policy if exists promotions_owner_delete on public.promotions;
create policy promotions_owner_delete on public.promotions for delete to authenticated using (public.is_store_owner(store_id));

drop policy if exists favorites_own_all on public.favorites;
create policy favorites_own_all on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists store_favorites_own_all on public.store_favorites;
create policy store_favorites_own_all on public.store_favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists addresses_own_all on public.addresses;
create policy addresses_own_all on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists loyalty_own_select on public.loyalty_cards;
create policy loyalty_own_select on public.loyalty_cards for select to authenticated using (user_id = auth.uid());

drop policy if exists orders_customer_read on public.orders;
create policy orders_customer_read on public.orders for select to authenticated using (user_id = auth.uid() or public.is_store_owner(store_id));
drop policy if exists orders_seller_status on public.orders;
create policy orders_seller_status on public.orders for update to authenticated using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
drop policy if exists order_items_related_read on public.order_items;
create policy order_items_related_read on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_store_owner(o.store_id)))
);

revoke insert, update, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_items from authenticated;
grant update(status) on public.orders to authenticated;

create index if not exists promotions_active_code_idx
  on public.promotions (store_id, upper(code))
  where is_active = true;
create index if not exists orders_user_placed_idx
  on public.orders (user_id, placed_at desc);
create index if not exists orders_store_status_idx
  on public.orders (store_id, status, placed_at desc);
