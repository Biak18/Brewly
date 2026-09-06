-- Server-authoritative add-to-bag for the shop (products / product_variants).
--
-- Why an RPC instead of direct cart_items writes:
-- - validates variant + parent product are active (client cache can be stale)
-- - enforces stock caps server-side (existing qty + requested <= stock_quantity)
-- - upserts on (user_id, variant_id) so double-taps don't create duplicate lines
--
-- Matches the current remote schema:
--   public.cart_items(user_id, variant_id, quantity, ...)
--   public.product_variants(id, price, stock_quantity, is_active, product_id)
--   public.products(id, is_active)
-- Existing remote function was SECURITY INVOKER with EXECUTE granted to
-- anon/PUBLIC; this replaces it with SECURITY DEFINER + authenticated-only
-- EXECUTE, consistent with expected_cart_prices in
-- 20260828094551_cart_repricing_rpc.sql.

create or replace function public.add_to_cart(p_variant_id uuid, p_quantity integer default 1)
returns public.cart_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_variant public.product_variants%rowtype;
  v_product_active boolean;
  v_existing_qty integer;
  v_new_qty integer;
  v_result public.cart_items%rowtype;
begin
  if v_user_id is null then
    raise exception 'Please sign in to add to bag';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be at least 1';
  end if;

  select * into v_variant
  from public.product_variants
  where id = p_variant_id;

  if not found then
    raise exception 'This variant is unavailable';
  end if;

  if v_variant.is_active is false then
    raise exception 'This variant is unavailable';
  end if;

  select p.is_active into v_product_active
  from public.products p
  where p.id = v_variant.product_id;

  if not found or v_product_active is false then
    raise exception 'This variant is unavailable';
  end if;

  if coalesce(v_variant.stock_quantity, 0) <= 0 then
    raise exception 'Out of stock';
  end if;

  select quantity into v_existing_qty
  from public.cart_items
  where user_id = v_user_id
    and variant_id = p_variant_id;

  v_new_qty := coalesce(v_existing_qty, 0) + p_quantity;

  if v_new_qty > coalesce(v_variant.stock_quantity, 0) then
    raise exception 'Only % in stock', v_variant.stock_quantity;
  end if;

  insert into public.cart_items (user_id, variant_id, quantity)
  values (v_user_id, p_variant_id, v_new_qty)
  on conflict (user_id, variant_id)
  do update set quantity = excluded.quantity, updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.add_to_cart(uuid, integer) from anon;
revoke all on function public.add_to_cart(uuid, integer) from public;
grant execute on function public.add_to_cart(uuid, integer) to authenticated;
