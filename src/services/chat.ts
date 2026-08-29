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

export async function fetchOrderMessages(
  orderId: string,
  limit = 200,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_FIELDS)
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapMessage);
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
export function subscribeOrderMessages(
  orderId: string,
  onInsert: (message: ChatMessage) => void,
  onError?: (error: Error) => void,
): () => void {
  const channel = supabase
    .channel(`chat:${orderId}`)
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
