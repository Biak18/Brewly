-- Coffee ratings recompute from customer reviews.
-- Captures the previously dashboard-applied functions so repo migrations match the live DB.

create or replace function public.refresh_coffee_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.coffee_id, old.coffee_id);
  update public.coffees c
     set rating = sub.avg_rating
    from (
      select round(avg(rating)::numeric, 1) as avg_rating
        from public.coffee_reviews
       where coffee_id = target
    ) sub
   where c.id = target;
  return null;
end;
$$;

drop trigger if exists trg_refresh_rating on public.coffee_reviews;
create trigger trg_refresh_rating
after insert or update or delete on public.coffee_reviews
for each row execute function public.refresh_coffee_rating();

-- Server-enforced: one review per coffee per order (unique constraint lives in
-- 20260829120100_drop_redundant_review_index.sql).

create or replace function public.submit_coffee_review(
  p_coffee_id uuid,
  p_order_id uuid,
  p_rating integer,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_valid boolean;
begin
  v_user := auth.uid();
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_rating not between 1 and 5 then raise exception 'Invalid rating'; end if;

  select exists (
    select 1 from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.id = p_order_id and o.user_id = v_user
      and o.status = 'completed' and oi.coffee_id = p_coffee_id
  ) into v_valid;

  if not v_valid then
    raise exception 'You can only rate drinks from your completed orders';
  end if;

  insert into public.coffee_reviews (coffee_id, user_id, order_id, rating, comment)
  values (p_coffee_id, v_user, p_order_id, p_rating, nullif(trim(p_comment), ''));
end;
$$;

revoke all on function public.submit_coffee_review(uuid, uuid, integer, text) from public;
grant execute on function public.submit_coffee_review(uuid, uuid, integer, text) to authenticated;
