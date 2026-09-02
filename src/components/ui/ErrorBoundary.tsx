// src/components/ui/ErrorBoundary.tsx
// Root JS error boundary. Without this, any render error unmounts the whole
// React tree and leaves the user on a white screen (Sentry logs alone don't
// help them recover). Class component by design, error boundaries require it.
import { Button } from "@/components/ui/Button";
import { captureException } from "@/lib/sentry";
import { useTheme } from "@/theme";
import { Coffee } from "lucide-react-native";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { componentStack: info.componentStack });
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return <ErrorFallback onRetry={this.reset} />;
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.xl,
          backgroundColor: colors.cream,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Coffee size={32} color={colors.espresso} strokeWidth={1.6} />
      </View>
      <Text
        style={{
          color: colors.ink,
          fontSize: typography.subheading,
          fontWeight: "800",
          marginBottom: spacing.sm,
          textAlign: "center",
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.bodySmall,
          lineHeight: 20,
          textAlign: "center",
          marginBottom: spacing.xl,
        }}
      >
        The app hit an unexpected error and was stopped safely. Your cart and
        account are untouched.
      </Text>
      <Button label="Try again" onPress={onRetry} variant="primary" />
    </View>
  );
}
