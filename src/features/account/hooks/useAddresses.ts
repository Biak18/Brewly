// src/features/account/hooks/useAddresses.ts
import {
  Address,
  AddressInput,
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/services/addresses";
import { useAuthStore } from "@/stores/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ROOT = "addresses";

export function useAddresses() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: [ROOT, userId],
    queryFn: () => fetchAddresses(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useSaveAddress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
      isDefault,
    }: {
      id?: string;
      input: AddressInput;
      isDefault?: boolean;
    }) => {
      if (!userId) throw new Error("Not signed in");
      if (id) {
        await updateAddress(id, input);
        if (isDefault) await setDefaultAddress(userId, id);
        return undefined;
      }
      return createAddress(userId, input, !!isDefault);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROOT] }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROOT] }),
  });
}

export function useSetDefaultAddress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!userId) throw new Error("Not signed in");
      return setDefaultAddress(userId, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROOT] }),
  });
}

export type { Address };
