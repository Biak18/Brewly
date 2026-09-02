// src/stores/notificationStore.ts
// Persisted push-notification opt-in. Only the preference lives here, OS
// permission state and device tokens belong to the OS / push_tokens table.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type NotificationState = {
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      pushEnabled: false,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
    }),
    {
      name: "brewly-notifications",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pushEnabled: state.pushEnabled }),
    },
  ),
);
