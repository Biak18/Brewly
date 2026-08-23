// src/stores/networkStore.ts
import { create } from "zustand";

type NetworkState = { isOnline: boolean; setOnline: (online: boolean) => void };

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true, // optimistic default until the first real NetInfo event arrives
  setOnline: (online) => set({ isOnline: online }),
}));
