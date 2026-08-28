-- Drop legacy create_order overloads: they predate server-side price
-- validation (order_item_unit_price) and accepted arbitrary client prices.
-- Only the hardened 13-arg idempotent signature remains as the RPC entry point.
drop function if exists public.create_order(uuid,text,numeric,numeric,numeric,jsonb);
drop function if exists public.create_order(uuid,text,numeric,numeric,numeric,jsonb,numeric,text);
drop function if exists public.create_order(uuid,text,numeric,numeric,numeric,jsonb,numeric,text,numeric);
drop function if exists public.create_order(uuid,text,numeric,numeric,numeric,jsonb,numeric,text,numeric,numeric,text);

-- Tighten grants: create_order stays the only public entry point (authenticated).
-- create_order_with_delivery_fee and order_item_unit_price are internal
-- implementation details invoked by create_order under SECURITY DEFINER,
-- so no external role needs EXECUTE on them.
revoke execute on function public.create_order(uuid,text,numeric,numeric,numeric,jsonb,numeric,text,numeric,numeric,text,boolean,text) from anon, public;
revoke execute on function public.create_order_with_delivery_fee(uuid,text,numeric,numeric,numeric,jsonb,numeric,text,numeric,numeric,text,boolean,text) from anon, public, authenticated;
revoke execute on function public.order_item_unit_price(jsonb, uuid) from anon, public, authenticated;
