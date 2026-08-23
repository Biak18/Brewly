// src/services/orders.ts
import { CartLineItem } from "@/stores/cartStore";
import { computeOrderTotals } from "@/utils/orderTotals";
import { supabase } from "./supabase";
export { computeOrderTotals } from "@/utils/orderTotals";
export type OrderStatus = "received" | "preparing" | "ready" | "completed";
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
}): Promise<string> {
  const { subtotal, tax, total } = computeOrderTotals(params.items);

  const { data, error } = await supabase.rpc("create_order", {
    p_store_id: params.storeId,
    p_fulfillment: params.fulfillment,
    p_subtotal: subtotal,
    p_tax: tax,
    p_total: total,
    p_items: params.items.map((i) => ({
      coffee_id: i.coffeeId,
      size: i.size ?? null,
      temperature: i.temperature ?? null,
      milk: i.milk ?? null,
      extras: i.extras ?? [],
      quantity: i.quantity,
      unit_price: i.unitPrice,
      compare_at_price: i.compareAtUnitPrice ?? null,
    })),
  });

  if (error) throw error;
  return data as string; // create_order returns the new order's id
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
  placed_at: string;
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
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
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
