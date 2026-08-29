// src/features/chat/components/MessageBubble.tsx
import { ChatMessage } from "@/services/chat";
import { useTheme } from "@/theme";
import { Text, View } from "react-native";

type MessageBubbleProps = {
  message: ChatMessage;
  mine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  mine,
  isFirstInGroup,
  isLastInGroup,
}: MessageBubbleProps) {
  const { colors, spacing, radius, typography } = useTheme();

  // Tight radius on the "tail" corner of the group's last bubble — the one
  // detail that reads as a real chat app rather than a stack of boxes. Every
  // other bubble in a consecutive group stays uniformly rounded.
  const tailRadius = isLastInGroup ? 4 : radius.lg;
  const cornerStyle = mine
    ? {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: tailRadius,
      }
    : {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderBottomLeftRadius: tailRadius,
        borderBottomRightRadius: radius.lg,
      };

  return (
    <View
      style={{
        alignItems: mine ? "flex-end" : "flex-start",
        marginTop: isFirstInGroup ? spacing.sm : 2,
      }}
    >
      <View
        style={[
          {
            maxWidth: "78%",
            backgroundColor: mine ? colors.espresso : colors.surface2,
            paddingHorizontal: spacing.md,
            paddingVertical: 9,
          },
          cornerStyle,
        ]}
      >
        <Text
          style={{
            color: mine ? colors.surface : colors.ink,
            fontSize: typography.bodySmall,
            lineHeight: 19,
          }}
        >
          {message.body}
        </Text>
      </View>
      {isLastInGroup && (
        <Text
          style={{
            color: colors.muted,
            fontSize: typography.micro,
            marginTop: 3,
            marginHorizontal: 6,
          }}
        >
          {formatTime(message.created_at)}
        </Text>
      )}
    </View>
  );
}
