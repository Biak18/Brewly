// src/features/chat/components/OrderChat.tsx: full replacement
import { track } from "@/lib/analytics";
import {
  ChatMessage,
  CHAT_PAGE_SIZE,
  fetchOrderMessages,
  sendOrderMessage,
  subscribeOrderMessages,
} from "@/services/chat";
import { useToastStore } from "@/stores/toastStore";
import { useTheme } from "@/theme";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { Send } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { MessageBubble } from "./MessageBubble";

const PADDING_BOTTOM = Platform.OS === "ios" ? 20 : 0;
const GROUP_GAP_MS = 5 * 60 * 1000; // messages from the same sender within 5 minutes visually group together

// Keyboard-height spacer only, no longer drives any scroll call. An inverted
// list keeps "the bottom" anchored in place as the keyboard opens; it doesn't
// need to be told to scroll to reveal it.
const useGradualAnimation = () => {
  const height = useSharedValue(PADDING_BOTTOM);
  useKeyboardHandler(
    {
      onMove: (e) => {
        "worklet";
        height.value = Math.max(e.height, PADDING_BOTTOM);
      },
      onEnd: (e) => {
        "worklet";
        height.value = e.height;
      },
    },
    [],
  );
  return { height };
};

export function OrderChat({
  orderId,
  currentUserId,
}: {
  orderId: string;
  currentUserId: string;
}) {
  const { height } = useGradualAnimation();
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", orderId],
    queryFn: () => fetchOrderMessages(orderId),
  });

  // Older messages are paged in on demand ("Load earlier") so long histories
  // don't over-fetch on open. Realtime appends land on the newest page.
  const [earlierPages, setEarlierPages] = useState<ChatMessage[][]>([]);
  // Reset paged-in history when switching orders, done during render (the
  // React-endorsed pattern for state derived from a changed prop).
  const [prevOrderId, setPrevOrderId] = useState(orderId);
  if (prevOrderId !== orderId) {
    setPrevOrderId(orderId);
    setEarlierPages([]);
  }

  const allMessages = useMemo(
    () => [...earlierPages.slice().reverse().flat(), ...messages],
    [earlierPages, messages],
  );
  const oldestLoaded = allMessages.length ? allMessages[0].created_at : null;
  const hasMoreEarlier =
    (earlierPages.length
      ? earlierPages[earlierPages.length - 1].length
      : messages.length) >= CHAT_PAGE_SIZE;
  const loadEarlier = useMutation({
    mutationFn: () => fetchOrderMessages(orderId, { before: oldestLoaded }),
    onSuccess: (page) => setEarlierPages((prev) => [...prev, page]),
    onError: () => showToast(t("common.checkConnection")),
  });

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

  // Grouping computed once here in chronological order (easy to reason about
  // "previous"/"next"), then reversed once for the inverted list's data prop,
  // not recomputed per-row inside renderItem.
  const invertedData = useMemo(() => {
    const withGroups = allMessages.map((m, i) => {
      const prev = allMessages[i - 1];
      const next = allMessages[i + 1];
      const isFirstInGroup =
        !prev ||
        prev.sender_id !== m.sender_id ||
        new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() >
          GROUP_GAP_MS;
      const isLastInGroup =
        !next ||
        next.sender_id !== m.sender_id ||
        new Date(next.created_at).getTime() - new Date(m.created_at).getTime() >
          GROUP_GAP_MS;
      return { ...m, isFirstInGroup, isLastInGroup };
    });
    return [...withGroups].reverse();
  }, [allMessages]);

  const send = useMutation({
    mutationFn: () =>
      sendOrderMessage({ orderId, senderId: currentUserId, body: draft }),
    onSuccess: () => {
      setDraft("");
      Haptics.selectionAsync();
      track("chat_message_sent", { order_id: orderId });
    },
    onError: () => showToast(t("chat.sendFailed")),
  });

  const handleSend = useCallback(() => {
    if (!draft.trim() || send.isPending) return;
    send.mutate();
  }, [draft, send]);

  // Re-sync whenever the screen is focused (e.g. opened from a push) so the
  // most recent message is never missed if a realtime event was dropped.
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["chat", orderId] });
    }, [queryClient, orderId]),
  );

  const fakeView = useAnimatedStyle(
    () => ({
      height: Math.abs(height.value),
      marginBottom: height.value > 0 ? 0 : PADDING_BOTTOM,
    }),
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.muted} />
        </View>
      ) : allMessages.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: typography.body,
              textAlign: "center",
            }}
          >
            {t("chat.empty")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={invertedData}
          keyExtractor={(m) => m.id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              mine={item.sender_id === currentUserId}
              isFirstInGroup={item.isFirstInGroup}
              isLastInGroup={item.isLastInGroup}
            />
          )}
          // Inverted list: the footer renders at the visual top, right above
          // the oldest message, exactly where "load earlier" belongs.
          ListFooterComponent={
            hasMoreEarlier ? (
              <Pressable
                onPress={() => loadEarlier.mutate()}
                disabled={loadEarlier.isPending}
                style={{
                  alignItems: "center",
                  paddingVertical: spacing.md,
                }}
                accessibilityRole="button"
                accessibilityLabel={t("chat.loadEarlier")}
              >
                {loadEarlier.isPending ? (
                  <ActivityIndicator color={colors.muted} size="small" />
                ) : (
                  <Text
                    style={{
                      color: colors.espresso,
                      fontSize: typography.caption,
                      fontWeight: "700",
                    }}
                  >
                    {t("chat.loadEarlier")}
                  </Text>
                )}
              </Pressable>
            ) : null
          }
          contentContainerStyle={{
            padding: spacing.lg,
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.line,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: 22,
            color: colors.ink,
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
            fontSize: typography.bodySmall,
            maxHeight: 96,
            backgroundColor: colors.bg,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || send.isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              draft.trim() && !send.isPending
                ? colors.espresso
                : colors.surface2,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel={t("chat.sendMessage")}
        >
          <Send
            size={18}
            color={
              draft.trim() && !send.isPending ? colors.surface : colors.muted
            }
            strokeWidth={2}
          />
        </Pressable>
      </View>
      <Animated.View style={fakeView} />
    </View>
  );
}
