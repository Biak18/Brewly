// src/services/chat.ts
// Per-order chat between the buyer and the store owner. Access is enforced
// by RLS on chat_messages via order participation; this layer only shapes
// data and wires the realtime subscription.
import { supabase } from "./supabase";

export type ChatMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string;
};

const MESSAGE_FIELDS = `
  id, order_id, sender_id, body, created_at,
  profiles(full_name)
`;

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    order_id: row.order_id,
    sender_id: row.sender_id,
    body: row.body,
    created_at: row.created_at,
    sender_name: row.profiles?.full_name || "Coffee lover",
  };
}

export const CHAT_PAGE_SIZE = 50;

// Newest page first (descending), then reversed — callers consume
// chronological order. `before` pages further back in history for
// "load earlier" (pass the oldest currently-loaded created_at).
export async function fetchOrderMessages(
  orderId: string,
  options: { limit?: number; before?: string | null } = {},
): Promise<ChatMessage[]> {
  const limit = options.limit ?? CHAT_PAGE_SIZE;
  let query = supabase
    .from("chat_messages")
    .select(MESSAGE_FIELDS)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (options.before) query = query.lt("created_at", options.before);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapMessage).reverse();
}

// Collapse whitespace and cap length — the DB check rejects >1000 chars,
// so normalize here to keep sends within bounds instead of erroring.
export function normalizeMessageBody(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 1000);
}

export async function sendOrderMessage(params: {
  orderId: string;
  senderId: string;
  body: string;
}): Promise<void> {
  const body = normalizeMessageBody(params.body);
  if (!body) throw new Error("Message is empty");
  const { error } = await supabase.from("chat_messages").insert({
    order_id: params.orderId,
    sender_id: params.senderId,
    body,
  });
  if (error) throw error;
}

// Live updates for one thread. Returns an unsubscribe function.
//
// The channel name is made unique per call (not just `chat:${orderId}`):
// Supabase caches channels by topic, so reusing the same name while a prior
// subscription is still subscribed throws "cannot add postgres_changes
// callbacks … after subscribe()". A unique topic avoids that collision
// entirely even if the screen remounts (e.g. a notification tap re-opens it).
export function subscribeOrderMessages(
  orderId: string,
  onInsert: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
): () => void {
  const channelName = `chat:${orderId}:${Math.random().toString(36).slice(2, 10)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `order_id=eq.${orderId}`,
      },
      (payload: any) => onInsert(mapMessage(payload.new)),
    )
    .subscribe((status: string, err?: Error) => {
      if (status === "CHANNEL_ERROR" && onError) onError(err ?? new Error("Chat connection lost"));
    });
  return () => {
    supabase.removeChannel(channel);
  };
}
