// src/features/seller/hooks/useSellerEarnings.ts
import { fetchSellerEarnings } from "@/services/sellerEarnings";
import { useQuery } from "@tanstack/react-query";

export function useSellerEarnings(storeId: string | undefined) {
  return useQuery({
    queryKey: ["seller-earnings", storeId],
    queryFn: () => fetchSellerEarnings(storeId!),
    enabled: !!storeId,
  });
}
