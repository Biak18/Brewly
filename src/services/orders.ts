// src/services/orders.ts
import { CartLineItem } from "@/stores/cartStore";
import { computeOrderTotals, DELIVERY_FEE } from "@/utils/orderTotals";
import { supabase } from "./supabase";
export { computeOrderTotals, DELIVERY_FEE } from "@/utils/orderTotals";
export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
export type OrderSummary = {
  id: string;
  status: OrderStatus;
  total: number;
  placed_at: string;
  item_count: number;
  thumbnail_url: string | null;
};

export async function placeOrder(params: {
  storeId: string;
  fulfillment: "pickup" | "delivery";
  items: CartLineItem[];
  loyaltyDiscount?: number;
  tip?: number;
  promoCode?: string | null;
  redeemLoyalty?: boolean;
  idempotencyKey?: string;
  /** Required snapshot string when fulfillment is "delivery". */
  deliveryAddress?: string | null;
}): Promise<string> {
  const { subtotal, tax, total } = computeOrderTotals(params.items);
  const discount = Math.min(Math.max(params.loyaltyDiscount ?? 0, 0), total);
  const tip = Math.max(params.tip ?? 0, 0);
  const deliveryFee = params.fulfillment === "delivery" ? DELIVERY_FEE : 0;
  if (params.fulfillment === "delivery" && !params.deliveryAddress) {
    throw new Error("Delivery address required");
  }
  const grandTotal =
    Math.round((total - discount + tip + deliveryFee) * 100) / 100;

  const rpcParams = {
    p_store_id: params.storeId,
    p_fulfillment: params.fulfillment,
    p_subtotal: subtotal,
    p_tax: tax,
    p_total: grandTotal,
    p_items: params.items.map((i) => ({
      coffee_id: i.coffeeId,
      size: i.size ?? null,
      temperature: i.temperature ?? null,
      milk: i.milk ?? null,
      extras: i.extras ?? [],
      quantity: i.quantity,
      unit_price: i.unitPrice,
      compare_at_price: null,
    })),
    p_tip: tip,
    p_promo_code: params.promoCode ?? null,
    p_discount: discount,
    p_delivery_fee: deliveryFee,
    p_delivery_address: params.deliveryAddress ?? null,
    p_redeem_loyalty: params.redeemLoyalty ?? false,
    p_idempotency_key: params.idempotencyKey ?? null,
  };
  const { data, error } = await supabase.rpc("create_order", rpcParams);
  console.log(error);
  if (error) throw error;
  return data as string; // create_order returns the new order's id
}

export type PaymentMethod = "cash" | "kpay" | "mmqr";
export type PaymentStatus = "unpaid" | "awaiting_verification" | "verified";

// Customer attaches their transfer proof right after placing the order.
// Server-guarded: only the buyer, only while status is still "received"
// and payment hasn't been set before.
export async function attachPayment(
  orderId: string,
  method: Exclude<PaymentMethod, "cash">,
  ref: string,
): Promise<void> {
  const { error } = await supabase.rpc("attach_payment", {
    p_order_id: orderId,
    p_method: method,
    p_ref: ref,
  });
  if (error) throw error;
}

// Seller confirms or rejects a pending transfer. Rejected payments fall back
// to "unpaid" so the buyer can resubmit a correct transaction ID.
export async function setPaymentVerified(
  orderId: string,
  verified: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_payment_verified", {
    p_order_id: orderId,
    p_verified: verified,
  });
  if (error) throw error;
}

export type OrderWithItems = {
  id: string;
  status: OrderStatus;
  user_id: string;
  store_id: string;
  fulfillment: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  tip: number;
  promo_code: string | null;
  delivery_fee: number;
  delivery_address: string | null;
  placed_at: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  order_items: {
    id: string;
    coffee_id: string;
    size: string | null;
    temperature: string | null;
    milk: string | null;
    extras: string[] | null;
    quantity: number;
    unit_price: number;
    compare_at_price: number | null;
    coffees: { name: string; image_url: string | null } | null;
  }[];
};

export async function fetchOrderWithItems(
  orderId: string,
): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, coffees(name, image_url))")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data as OrderWithItems;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
}

// Server-guarded: the RPC re-checks ownership and that the order is still in
// "received" before flipping it to "cancelled" — never trust the client alone.
export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
  });
  if (error) throw error;
}

export async function fetchOrdersList(): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total, placed_at, order_items(coffees(image_url), created_at)",
    )
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o: any) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    placed_at: o.placed_at,
    item_count: o.order_items?.length ?? 0,
    thumbnail_url: o.order_items?.[0]?.coffees?.image_url ?? null,
  }));
}

function mapToOrderSummaries(data: any[]): OrderSummary[] {
  return (data ?? []).map((o: any) => ({
    id: o.id,
    status: o.status,
    total: o.total,
    placed_at: o.placed_at,
    item_count: o.order_items?.length ?? 0,
    thumbnail_url: o.order_items?.[0]?.coffees?.image_url ?? null,
  }));
}

export async function fetchMyPurchases(
  userId: string,
  limit?: number,
): Promise<OrderSummary[]> {
  let query = supabase
    .from("orders")
    .select(
      "id, status, total, placed_at, order_items(coffees(image_url), created_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .order("placed_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;

  return mapToOrderSummaries(data as any);
}

export async function fetchMyShopOrders(
  storeId: string,
): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total, placed_at, order_items(coffees(image_url), created_at)",
    )
    .eq("store_id", storeId)
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return mapToOrderSummaries(data);
}

// ---------------------------------------------------------------------
// Paginated variants — used by the Orders screen's infinite scroll.
// Fetching one extra row beyond the window lets us detect "hasMore"
// without a separate count query. Existing non-paginated fetches above
// are kept for callers that want the full list (e.g. home).
// ---------------------------------------------------------------------

export const ORDERS_PAGE_SIZE = 20;

export type OrderSummaryPage = {
  orders: OrderSummary[];
  hasMore: boolean;
};

const ORDER_SUMMARY_SELECT =
  "id, status, total, placed_at, order_items(coffees(image_url), created_at)";

function baseOrderSummaryQuery() {
  return supabase
    .from("orders")
    .select(ORDER_SUMMARY_SELECT)
    .order("created_at", { referencedTable: "order_items", ascending: true })
    .order("placed_at", { ascending: false });
}

export async function fetchMyPurchasesPage(
  userId: string,
  page: number,
): Promise<OrderSummaryPage> {
  // await new Promise((resolve) => setTimeout(resolve, 5000));

  const from = page * ORDERS_PAGE_SIZE;
  const { data, error } = await baseOrderSummaryQuery()
    .eq("user_id", userId)
    .range(from, from + ORDERS_PAGE_SIZE);
  if (error) throw error;

  const rows = (data ?? []) as any[];
  return {
    orders: mapToOrderSummaries(rows.slice(0, ORDERS_PAGE_SIZE)),
    hasMore: rows.length > ORDERS_PAGE_SIZE,
  };
}

export async function fetchMyShopOrdersPage(
  storeId: string,
  page: number,
): Promise<OrderSummaryPage> {
  const from = page * ORDERS_PAGE_SIZE;
  const { data, error } = await baseOrderSummaryQuery()
    .eq("store_id", storeId)
    .range(from, from + ORDERS_PAGE_SIZE);
  if (error) throw error;

  const rows = (data ?? []) as any[];
  return {
    orders: mapToOrderSummaries(rows.slice(0, ORDERS_PAGE_SIZE)),
    hasMore: rows.length > ORDERS_PAGE_SIZE,
  };
}
