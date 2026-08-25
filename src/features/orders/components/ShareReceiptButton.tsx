// src/features/orders/components/ShareReceiptButton.tsx
import { Button } from "@/components/ui/Button";
import { buildReceiptText } from "@/features/orders/components/receipt";
import { OrderWithItems } from "@/services/orders";
import { useToastStore } from "@/stores/toastStore";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { Share } from "react-native";

export function ShareReceiptButton({
  order,
  storeName,
}: {
  order: OrderWithItems;
  storeName?: string;
}) {
  const showToast = useToastStore((s) => s.show);
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: `Brewly receipt #${order.id.slice(0, 8).toUpperCase()}`,
        message: buildReceiptText(order, storeName),
      });
    } catch {
      showToast("Couldn't open the share sheet");
    } finally {
      setSharing(false);
    }
  }, [order, storeName, showToast]);

  return (
    <Button
      label="Share receipt"
      onPress={handleShare}
      loading={sharing}
      variant="soft"
    />
  );
}
