// src/features/chat/components/OrderChat.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import {
  fetchOrderMessages,
  ChatMessage,
  sendOrderMessage,
  subscribeOrderMessages,
} from "@/services/chat";
import { track } from "@/lib/analytics";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderChat({
  orderId,
  currentUserId,
}: {
  orderId: string;
  currentUserId: string;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", orderId],
    queryFn: () => fetchOrderMessages(orderId),
  });

  // Live updates from the other participant.
  useEffect(() => {
    const unsubscribe = subscribeOrderMessages(orderId, (message) => {
      queryClient.setQueryData<ChatMessage[]>(["chat", orderId], (prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === message.id)) return list;
        return [...list, message];
      });
    });
    return unsubscribe;
  }, [orderId, queryClient]);

  const send = useMutation({
    mutationFn: () =>
      sendOrderMessage({ orderId, senderId: currentUserId, body: draft }),
    onSuccess: () => {
      setDraft("");
      Haptics.selectionAsync();
      track("chat_message_sent", { order_id: orderId });
    },
    onError: () => showToast("Could not send message"),
  });

  const handleSend = useCallback(() => {
    if (!draft.trim() || send.isPending) return;
    send.mutate();
  }, [draft, send]);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.lg,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.body,
          fontWeight: "800",
          marginBottom: spacing.md,
        }}
      >
        Messages
      </Text>

      <View style={{ minHeight: 40, marginBottom: spacing.md }}>
        {isLoading ? (
          <Text style={{ color: colors.muted, fontSize: typography.bodySmall }}>
            Loading…
          </Text>
        ) : messages.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: typography.bodySmall }}>
            No messages yet. Say something about your order.
          </Text>
        ) : (
          <ScrollView
            style={{ maxHeight: 280 }}
            contentContainerStyle={{ gap: spacing.sm }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <View
                  key={m.id}
                  style={{ alignItems: mine ? "flex-end" : "flex-start" }}
                >
                  <View
                    style={{
                      maxWidth: "82%",
                      backgroundColor: mine ? colors.espresso : colors.surface2,
                      borderRadius: radius.lg,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        color: mine ? colors.surface : colors.ink,
                        fontSize: typography.bodySmall,
                      }}
                    >
                      {m.body}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: typography.micro,
                      marginTop: 2,
                      marginHorizontal: 4,
                    }}
                  >
                    {formatTime(m.created_at)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: spacing.sm,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a message…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.md,
            color: colors.ink,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: typography.bodySmall,
            maxHeight: 96,
            textAlignVertical: "top",
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || send.isPending}
          style={{
            backgroundColor:
              draft.trim() && !send.isPending ? colors.espresso : colors.surface2,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel="Send message"
        >
          <Text
            style={{
              color: draft.trim() && !send.isPending ? colors.surface : colors.muted,
              fontWeight: "800",
              fontSize: typography.bodySmall,
            }}
          >
            Send
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
