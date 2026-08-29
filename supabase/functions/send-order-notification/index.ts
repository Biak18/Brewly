// supabase/functions/send-order-notification/index.ts
// Single edge function invoked by Supabase Database Webhooks for two tables:
//   - orders    (INSERT = new order → seller; UPDATE status change → buyer)
//   - chat_messages (INSERT → notify the other participant)
// Mirrors the dashboard-deployed function. A Database Webhook for each table
// must POST its change payload here (see README / dashboard config).
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
  if (expectedSecret && req.headers.get("x-webhook-secret") !== expectedSecret) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- Chat: notify the OTHER participant of the thread ---
    if (table === "chat_messages" && type === "INSERT") {
      return await notifyChatMessage(supabase, record);
    }

    // --- Orders: existing behavior ---
    let targetUserId: string | null = null;
    let title = "";
    let body = "";

    if (type === "INSERT") {
      const { data: store } = await supabase
        .from("stores")
        .select("owner_id, name")
        .eq("id", record.store_id)
        .single();
      if (!store) return new Response("store not found", { status: 200 });
      targetUserId = store.owner_id;
      title = "New order";
      body = `A new order just came in at ${store.name} — $${Number(
        record.total,
      ).toFixed(2)}`;
    } else if (type === "UPDATE" && old_record && record.status !== old_record.status) {
      targetUserId = record.user_id;
      const statusLabel: Record<string, string> = {
        received: "received",
        preparing: "being prepared",
        ready: "ready for pickup",
        completed: "completed",
      };
      title = "Order update";
      body = `Your order is now ${statusLabel[record.status] ?? record.status}.`;
    } else {
      return new Response("no-op", { status: 200 });
    }

    if (!targetUserId) return new Response("no target user", { status: 200 });

    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", targetUserId);
    if (!tokens || tokens.length === 0) {
      return new Response("no tokens", { status: 200 });
    }

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data: { orderId: record.id },
    }));

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
});

async function notifyChatMessage(supabase: any, record: any): Promise<Response> {
  const orderId = record.order_id;
  const senderId = record.sender_id;

  const { data: order } = await supabase
    .from("orders")
    .select("user_id, store_id")
    .eq("id", orderId)
    .single();
  if (!order) return new Response("order not found", { status: 200 });

  const { data: store } = await supabase
    .from("stores")
    .select("owner_id, name")
    .eq("id", order.store_id)
    .single();

  const isBuyerSender = senderId === order.user_id;
  const recipientId = isBuyerSender ? store?.owner_id : order.user_id;
  if (!recipientId || recipientId === senderId) {
    return new Response("no recipient", { status: 200 });
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", senderId)
    .single();
  const senderName = isBuyerSender
    ? "A customer"
    : (senderProfile?.full_name ?? "The shop");
  const snippet = (record.body ?? "").slice(0, 120);

  const title = isBuyerSender ? "New message" : `Message from ${senderName}`;
  const body = `${senderName}: ${snippet}`;

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", recipientId);
  if (!tokens || tokens.length === 0) {
    return new Response("no tokens", { status: 200 });
  }

  const messages = tokens.map((t: any) => ({
    to: t.token,
    sound: "default",
    title,
    body,
    data: { orderId: orderId },
  }));

  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response("ok", { status: 200 });
}
