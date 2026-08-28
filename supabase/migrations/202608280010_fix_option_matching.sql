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

  if not found then raise exception 'Coffee is unavailable for this store'; end if;

  foreach option_type in array array['size', 'temperature', 'milk'] loop
    option_label := nullif(trim(p_item->>option_type), '');
    if option_label is not null then
      if not exists (
        select 1
        from public.coffee_options o
        where o.store_id = p_store_id
          and o.type = option_type
          and lower(trim(o.label)) = lower(option_label)
          and (
            coffee_row.category_id is null
            or not exists (
              select 1 from public.coffee_option_categories oc
              where oc.option_id = o.id
            )
            or exists (
              select 1 from public.coffee_option_categories oc
              where oc.option_id = o.id
                and oc.category_id = coffee_row.category_id
            )
          )
      ) then raise exception 'Invalid coffee option'; end if;

      option_total := option_total + coalesce((
        select o.price_delta
        from public.coffee_options o
        where o.store_id = p_store_id
          and o.type = option_type
          and lower(trim(o.label)) = lower(option_label)
          and (
            coffee_row.category_id is null
            or not exists (
              select 1 from public.coffee_option_categories oc
              where oc.option_id = o.id
            )
            or exists (
              select 1 from public.coffee_option_categories oc
              where oc.option_id = o.id
                and oc.category_id = coffee_row.category_id
            )
          )
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
      select 1
      from public.coffee_options o
      where o.store_id = p_store_id
        and o.type = 'extra'
        and lower(trim(o.label)) = lower(option_label)
        and (
          coffee_row.category_id is null
          or not exists (
            select 1 from public.coffee_option_categories oc
            where oc.option_id = o.id
          )
          or exists (
            select 1 from public.coffee_option_categories oc
            where oc.option_id = o.id
              and oc.category_id = coffee_row.category_id
          )
        )
    ) then raise exception 'Invalid coffee extra'; end if;

    option_total := option_total + coalesce((
      select o.price_delta
      from public.coffee_options o
      where o.store_id = p_store_id
        and o.type = 'extra'
        and lower(trim(o.label)) = lower(option_label)
        and (
          coffee_row.category_id is null
          or not exists (
            select 1 from public.coffee_option_categories oc
            where oc.option_id = o.id
          )
          or exists (
            select 1 from public.coffee_option_categories oc
            where oc.option_id = o.id
              and oc.category_id = coffee_row.category_id
          )
        )
      order by o.id
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
