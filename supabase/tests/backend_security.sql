begin;

select plan(7);

select has_function(
  'public',
  'create_order',
  array['uuid', 'text', 'numeric', 'numeric', 'numeric', 'jsonb', 'numeric', 'text', 'numeric', 'numeric', 'text', 'boolean', 'text'],
  'create_order uses the hardened idempotent signature'
);

select has_function(
  'public',
  'update_order_status',
  array['uuid', 'text'],
  'seller order status changes use an RPC'
);

select has_function(
  'public',
  'set_default_address',
  array['uuid'],
  'address defaults use an atomic RPC'
);

select has_index(
  'public',
  'orders_user_idempotency_key_idx',
  'orders have a per-user idempotency index'
);

select has_index(
  'public',
  'addresses_one_default_per_user_idx',
  'addresses have one-default protection'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ),
  'profiles retain an own-row update policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'push_tokens'
      and policyname = 'push_tokens_own_insert'
  ),
  'push tokens require an own-user insert policy'
);

select * from finish();
rollback;
