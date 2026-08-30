-- Fixes account self-deletion: Supabase forbids direct SQL DELETE on
-- storage.objects (SQLSTATE 42501). Avatar cleanup must happen via the
-- Storage API on the client instead, so we drop that line here and let
-- src/services/profile.ts remove the file through supabase.storage.
create or replace function public.delete_account()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  target uuid := auth.uid();
begin
  if target is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.stores where owner_id = target) then
    raise exception 'Seller accounts with a store cannot self-delete. Contact support.';
  end if;

  delete from public.favorites where user_id = target;
  delete from public.coffee_reviews where user_id = target;
  delete from public.orders where user_id = target; -- order_items/reviews cascade, loyalty_events.order_id set null
  delete from public.loyalty_cards where user_id = target; -- events cascade

  delete from auth.users where id = target;
end;
$function$;
