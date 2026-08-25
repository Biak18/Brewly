// src/features/orders/components/receipt.ts
import { OrderWithItems } from "@/services/orders";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

function lineItemText(item: OrderWithItems["order_items"][number]): string {
  const qty = `${item.quantity}x`;
  const name = item.coffees?.name ?? "Drink";
  const amount = `$${(item.unit_price * item.quantity).toFixed(2)}`;
  const options = [
    item.size,
    item.temperature,
    item.milk,
    ...(item.extras ?? []),
  ]
    .filter(Boolean)
    .join(" · ");
  return [`${qty} ${name} — ${amount}`, options ? `   ${options}` : null]
    .filter(Boolean)
    .join("\n");
}

export function buildReceiptText(
  order: OrderWithItems,
  storeName?: string,
): string {
  const placedAt = new Date(
    order.placed_at ?? new Date().toISOString(),
  ).toLocaleString();
  const lines: string[] = [
    "Brewly — Order receipt",
    `Order #${order.id.slice(0, 8).toUpperCase()}`,
    `Placed: ${placedAt}`,
  ];
  if (storeName) lines.push(`Shop: ${storeName}`);
  if (order.fulfillment === "delivery" && order.delivery_address) {
    lines.push(`Delivery to: ${order.delivery_address}`);
  }
  if (STATUS_LABELS[order.status])
    lines.push(`Status: ${STATUS_LABELS[order.status]}`);

  lines.push("", "— Items —", ...order.order_items.map(lineItemText), "");

  lines.push(`Subtotal        $${order.subtotal.toFixed(2)}`);
  lines.push(`Tax             $${order.tax.toFixed(2)}`);
  if ((order.discount ?? 0) > 0)
    lines.push(
      `Discount${order.promo_code ? ` (${order.promo_code})` : ""}   -$${order.discount.toFixed(2)}`,
    );
  if ((order.tip ?? 0) > 0) lines.push(`Tip             $${order.tip.toFixed(2)}`);
  if ((order.delivery_fee ?? 0) > 0)
    lines.push(`Delivery fee    $${order.delivery_fee.toFixed(2)}`);
  lines.push(`TOTAL           $${Number(order.total).toFixed(2)}`);

  lines.push("");
  const method =
    order.payment_method === "cash"
      ? "Cash on pickup"
      : order.payment_method.toUpperCase();
  const payStatus =
    order.payment_status === "verified"
      ? "Paid"
      : order.payment_status === "awaiting_verification"
        ? "Verifying"
        : "Unpaid";
  lines.push(`Payment: ${method} · ${payStatus}`);
  if (order.payment_ref) lines.push(`TRX ID: ${order.payment_ref}`);

  return lines.join("\n");
}
