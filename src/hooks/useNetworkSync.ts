// src/hooks/useNetworkSync.ts
import { useNetworkStore } from "@/stores/networkStore";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";

export function useNetworkSync() {
  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        const online =
          !!state.isConnected && state.isInternetReachable !== false;
        setOnline(online);
        useNetworkStore.getState().setOnline(online);
      });
    });
  }, []);
}
